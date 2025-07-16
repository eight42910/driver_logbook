'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
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
  const fetchUserProfile = useCallback(
    async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
      const maxRetries = 2;

      try {
        console.log(
          `📋 usersテーブルクエリ開始 (試行 ${retryCount + 1}/${
            maxRetries + 1
          }):`,
          userId
        );

        // Supabase認証状態を確認
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        console.log('🔐 Supabase セッション状態:', {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          sessionError,
        });

        if (!sessionData.session) {
          console.error('❌ セッションが存在しません');
          return null;
        }

        // タイムアウト付きクエリ（5秒）
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        );

        const result = (await Promise.race([queryPromise, timeoutPromise])) as {
          data: UserProfile | null;
          error: {
            code?: string;
            message: string;
            details?: string;
            hint?: string;
          } | null;
        };
        const { data, error } = result;

        if (error) {
          console.log('⚠️ usersテーブルクエリエラー:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });

          // PGRST116 (No rows found) の場合は新規作成
          if (error.code === 'PGRST116') {
            console.log('🆕 新規ユーザーレコード作成を開始');

            // 認証済みユーザーの情報を取得
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
              console.error('❌ 認証ユーザー情報が取得できません');
              return null;
            }

            // 新しいユーザーレコードを作成
            const newUserProfile: UserProfile = {
              id: userId,
              email: user.email || '',
              display_name: user.email?.split('@')[0] || undefined,
              company_name: undefined,
              vehicle_info: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { data: insertedData, error: insertError } = await supabase
              .from('users')
              .insert(newUserProfile)
              .select()
              .single();

            if (insertError) {
              console.error('❌ ユーザーレコード作成エラー:', insertError);
              // 作成に失敗してもデフォルトプロフィールを返す
              return newUserProfile;
            }

            console.log('✅ 新規ユーザーレコード作成成功:', insertedData);
            return insertedData;
          }

          // その他のエラーの場合はリトライ
          if (retryCount < maxRetries) {
            console.log(
              `🔄 ${retryCount + 1}回目の試行が失敗、リトライします...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (retryCount + 1))
            ); // 段階的待機
            return fetchUserProfile(userId, retryCount + 1);
          }

          console.error('❌ 最大リトライ回数に達しました');
          return null;
        }

        console.log('✅ usersテーブルからプロフィール取得成功:', data);
        return data;
      } catch (error) {
        console.error(
          `❌ fetchUserProfile catch エラー (試行 ${retryCount + 1}):`,
          error
        );

        if (retryCount < maxRetries) {
          console.log(`🔄 キャッチエラー後のリトライ ${retryCount + 1}...`);
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          return fetchUserProfile(userId, retryCount + 1);
        }

        return null;
      }
    },
    []
  );

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
    } catch {
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
    } catch {
      setUser(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    // 初回認証状態チェック（最適化版）
    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthContext初期化開始');
        console.log(
          '📍 Supabase URL:',
          process.env.NEXT_PUBLIC_SUPABASE_URL ? 'あり' : 'なし'
        );

        // タイムアウト付きでgetUser実行（5秒）
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('getUser timeout')), 5000)
        );

        const {
          data: { user },
          error,
        } = (await Promise.race([getUserPromise, timeoutPromise])) as {
          data: { user: User | null };
          error: Error | null;
        };

        if (error) {
          console.error('❌ getUser エラー:', error);
        }

        console.log(
          '🔍 初期認証状態:',
          user ? `ログイン済み (${user.email})` : '未ログイン'
        );
        setUser(user);

        // プロフィール取得は非同期で実行（ローディング完了を待たない）
        if (user) {
          console.log('👤 プロフィール取得開始:', user.id);

          // タイムアウト付きでプロフィール取得（10秒）
          const profilePromise = fetchUserProfile(user.id);
          const profileTimeoutPromise = new Promise<UserProfile | null>(
            (_, reject) =>
              setTimeout(
                () => reject(new Error('fetchUserProfile timeout')),
                10000
              )
          );

          Promise.race([profilePromise, profileTimeoutPromise])
            .then((profile) => {
              console.log('👤 プロフィール取得完了:', profile);
              setUserProfile(profile);
            })
            .catch((error) => {
              console.error('❌ プロフィール取得エラー:', error);
              setUserProfile(null);
            });
        }
      } catch (error) {
        console.error('❌ 認証初期化エラー:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        // ローディング状態を早期に完了
        console.log('⏰ ローディング状態を false に設定');
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
          // タイムアウト付きでプロフィール取得（10秒）
          const profilePromise = fetchUserProfile(session.user.id);
          const profileTimeoutPromise = new Promise<UserProfile | null>(
            (_, reject) =>
              setTimeout(
                () => reject(new Error('fetchUserProfile timeout')),
                10000
              )
          );

          Promise.race([profilePromise, profileTimeoutPromise])
            .then((profile) => {
              console.log('🔄 認証状態変更時プロフィール取得完了:', profile);
              setUserProfile(profile);
            })
            .catch((error) => {
              console.error('❌ 認証状態変更時プロフィール取得エラー:', error);
              setUserProfile(null);
            });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

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
