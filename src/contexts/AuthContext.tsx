'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// ユーザープロフィール型定義
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

// 認証コンテキスト作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthContextを使用するカスタムフック
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// プロフィール自動作成機能
async function createUserProfile(user: User): Promise<UserProfile> {
  // メールアドレスのローカル部から表示名を生成
  const displayName = user.email?.split('@')[0] || 'ユーザー';

  const profileData = {
    id: user.id,
    email: user.email!,
    display_name: displayName,
  };

  const { data, error } = await supabase
    .from('users')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    // プロフィールが既に存在する場合は取得
    if (error.code === '23505') {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        return existingProfile;
      }
    }
    throw error;
  }

  return data;
}

// 認証プロバイダーコンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 初期認証状態の確認
  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ユーザープロフィールの読み込み
  async function loadUserProfile(user: User) {
    try {
      // 既存のプロフィールを取得
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        // プロフィールが存在しない場合は自動作成
        const newProfile = await createUserProfile(user);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('プロフィール読み込みエラー:', error);

      // エラーが発生した場合は自動作成を試行
      try {
        const newProfile = await createUserProfile(user);
        setProfile(newProfile);
      } catch (createError) {
        console.error('プロフィール作成エラー:', createError);
      }
    } finally {
      setLoading(false);
    }
  }

  // ログイン機能
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 認証成功後はonAuthStateChangeで処理される
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // 新規登録機能
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // 認証成功後はonAuthStateChangeで処理される
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // ログアウト機能
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // プロフィール更新機能
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('認証されていません');

    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id);

    if (error) throw error;

    // ローカル状態を更新
    if (profile) {
      setProfile({ ...profile, ...data });
    }
  };

  // コンテキスト値
  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
