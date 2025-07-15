'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  // AuthContextから認証状態を監視してリダイレクト
  useEffect(() => {
    console.log('🔍 ログインページ認証チェック:', {
      loading,
      user: !!user,
      userId: user?.id,
      redirecting,
    });

    // 認証状態の確認が完了し、ログイン済みの場合はダッシュボードにリダイレクト
    if (!loading && user && !redirecting) {
      console.log('✅ ログイン済み、ダッシュボードにリダイレクト');
      setRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, loading, router, redirecting]);

  // 認証状態確認中またはリダイレクト中は読み込み表示
  if (loading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 既にログインしている場合は何も表示しない
  if (user) {
    return null;
  }

  // フォームの初期化
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    console.log('🔄 ログイン開始:', data.email);
    setIsLoading(true);
    setError(null);

    try {
      // Supabaseでログイン
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (authError) {
        console.error('❌ ログインエラー:', authError);
        setError('メールアドレスまたはパスワードが間違っています');
        return;
      }

      if (authData.user) {
        console.log('✅ ログイン成功:', authData.user.id);
        console.log('🔄 AuthContextの状態変更を待機中...');
        // AuthContextが自動的に状態を更新し、useEffectでリダイレクトされる
      }
    } catch (error: any) {
      console.error('❌ ログインエラー:', error);
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ログイン
          </CardTitle>
          <CardDescription className="text-center">
            運転手日報システムにログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@company.com"
                autoComplete="email"
                {...form.register('email')}
                className={form.formState.errors.email ? 'border-red-500' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="パスワードを入力"
                autoComplete="current-password"
                {...form.register('password')}
                className={
                  form.formState.errors.password ? 'border-red-500' : ''
                }
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">アカウントをお持ちでない方は </span>
            <Link
              href="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              新規登録
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
