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

  // ユーザープロフィールを取得する関数
  const fetchUserProfile = async (userId: string) => {
    console.log('📡 プロフィール取得開始:', userId);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📡 プロフィール取得レスポンス:', { data, error });

      if (error) {
        console.error('❌ プロフィール取得エラー:', error);
        // プロフィールが存在しない場合は基本的なプロフィールを返す
        if (error.code === 'PGRST116') {
          console.log('⚠️ プロフィール未存在、基本プロフィールを作成');
          // レコードが見つからない場合
          return {
            id: userId,
            email: '',
            display_name: null,
            company_name: null,
            vehicle_info: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return null;
      }

      console.log('✅ プロフィール取得成功:', data);
      return data;
    } catch (error) {
      console.error('❌ プロフィール取得例外:', error);
      return null;
    }
  };

  // ユーザー情報を更新する関数
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
      console.error('Error refreshing user:', error);
    }
  };

  // サインアウト関数
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // 初回読み込み時の認証状態チェック
    const getInitialAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log('🔍 初回認証チェック完了:', {
          user: !!user,
          userId: user?.id,
        });
        setUser(user);

        // 認証済みの場合のみプロフィール取得（非同期で実行）
        if (user) {
          fetchUserProfile(user.id)
            .then((profile) => {
              setUserProfile(profile);
            })
            .catch((error) => {
              console.error('プロフィール取得エラー:', error);
            });
        }
      } catch (error) {
        console.error('初回認証チェックエラー:', error);
      } finally {
        // 認証状態チェックは即座に完了
        setLoading(false);
      }
    };

    getInitialAuth();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth状態変更:', event, session?.user?.id);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('✅ ログイン検出:', session?.user?.id);
        setUser(session?.user ?? null);
        if (session?.user) {
          console.log('📡 プロフィール取得開始...');
          const profile = await fetchUserProfile(session.user.id);
          console.log('📡 プロフィール取得完了:', profile);
          setUserProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 ログアウト検出');
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
      console.log('🔄 Auth loading完了');
    });

    return () => subscription.unsubscribe();
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
