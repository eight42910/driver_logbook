'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
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
  const [profileLoading, setProfileLoading] = useState(false); // プロフィール読み込み専用
  const loadingRef = useRef(false); // 読み込み状態の参照（循環依存回避用）

  // ユーザープロフィールの読み込み
  const loadUserProfile = useCallback(
    async (user: User) => {
      // useRefを使用して循環依存を回避
      if (loadingRef.current) {
        console.log('プロフィール読み込み中のためスキップ:', user.email);
        return;
      }

      loadingRef.current = true;
      setProfileLoading(true);

      try {
        // 既存のプロフィールを取得
        const { data: existingProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116: レコードが見つからない以外のエラー
          throw fetchError;
        }

        if (existingProfile) {
          console.log('既存プロフィール読み込み成功:', existingProfile.email);
          setProfile(existingProfile);
        } else {
          // プロフィールが存在しない場合は自動作成
          console.log('プロフィール自動作成開始:', user.email);
          const newProfile = await createUserProfile(user);
          console.log('プロフィール作成成功:', newProfile.email);
          setProfile(newProfile);
        }
      } catch (error) {
        console.error('プロフィール読み込みエラー:', error);

        // エラーが発生した場合は自動作成を試行
        try {
          console.log('プロフィール作成リトライ:', user.email);
          const newProfile = await createUserProfile(user);
          setProfile(newProfile);
        } catch (createError) {
          console.error('プロフィール作成エラー:', createError);
          // 最終的にエラーの場合は基本情報のみ設定
          setProfile({
            id: user.id,
            email: user.email!,
            display_name: user.email?.split('@')[0] || 'ユーザー',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } finally {
        loadingRef.current = false;
        setProfileLoading(false);
        setLoading(false);
      }
    },
    [] // 依存配列を空にして循環依存を解決
  );

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

      try {
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user);
        } else {
          console.log('ログアウト: セッション終了');
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('認証状態変更エラー:', error);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  // ログイン機能
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 認証成功の確認
      if (data.user) {
        console.log('ログイン成功:', data.user.email);
        // onAuthStateChangeで自動的にユーザー状態が更新される
        return;
      } else {
        throw new Error('認証データが不正です');
      }
    } catch (error) {
      setLoading(false);
      console.error('ログインエラー詳細:', error);
      throw error;
    }
    // setLoading(false)は意図的に省略 - onAuthStateChangeで処理
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
