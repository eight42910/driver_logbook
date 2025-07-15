'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { User as UserProfile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // プロフィール取得
  const fetchUserProfile = async (
    userId: string
  ): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return {
          id: userId,
          email: '',
          display_name: undefined,
          company_name: undefined,
          vehicle_info: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return data;
    } catch (error) {
      return null;
    }
  };

  // ユーザー情報を更新
  const refreshUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const profile = await fetchUserProfile(user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      setUser(null);
      setUserProfile(null);
    }
  };

  // サインアウト
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      setUser(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // 初回認証状態チェック（最適化版）
    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthContext初期化開始');

        // より高速な初期化
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log('🔍 初期認証状態:', user ? 'ログイン済み' : '未ログイン');
        setUser(user);

        // プロフィール取得は非同期で実行（ローディング完了を待たない）
        if (user) {
          fetchUserProfile(user.id).then(setUserProfile);
        }
      } catch (error) {
        console.error('❌ 認証初期化エラー:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        // ローディング状態を早期に完了
        setLoading(false);
        console.log('✅ AuthContext初期化完了');
      }
    };

    initializeAuth();

    // 認証状態変更の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 認証状態変更:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
