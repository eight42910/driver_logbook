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

const registerSchema = z
  .object({
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
    confirmPassword: z.string(),
    displayName: z.string().optional(),
    companyName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  // フォームの初期化
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      companyName: '',
    },
  });

  // 認証状態変更時の処理
  useEffect(() => {
    console.log('🔍 登録ページ認証チェック:', {
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
          <p className="text-gray-600">
            {redirecting ? 'ダッシュボードに移動中...' : '認証状態を確認中...'}
          </p>
        </div>
      </div>
    );
  }

  // 既にログインしている場合は何も表示しない（リダイレクト中）
  if (user) {
    return null;
  }

  const onSubmit = async (data: RegisterForm) => {
    console.log('🔄 新規登録開始:', data.email);
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Supabaseで新規ユーザーを作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName || null,
            company_name: data.companyName || null,
          },
        },
      });

      if (authError) {
        console.error('❌ 登録エラー:', authError);
        setError(authError.message || '登録に失敗しました');
        return;
      }

      if (authData.user) {
        console.log('✅ 登録成功:', authData.user.id);

        // メール確認が必要な場合は成功メッセージを表示
        if (!authData.session) {
          setSuccess(true);
          setError(null);
          console.log('📧 メール確認が必要です');
          return;
        }

        // 即座にログインできる場合はダッシュボードにリダイレクト
        console.log('🔄 AuthContextの状態変更を待機中...');
        // AuthContextが自動的に状態を更新し、useEffectでリダイレクトされる
      }
    } catch (error: any) {
      console.error('❌ 登録エラー:', error);
      setError(error.message || '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 成功時の表示
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              登録完了
            </CardTitle>
            <CardDescription className="text-center">
              メールアドレスの確認が必要です
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                確認用のメールを送信しました。
                <br />
                メール内のリンクをクリックしてアカウントを有効化してください。
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">ログインページに戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            新規登録
          </CardTitle>
          <CardDescription className="text-center">
            運転手日報システムのアカウントを作成
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
              <Label htmlFor="email">メールアドレス *</Label>
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
              <Label htmlFor="password">パスワード *</Label>
              <Input
                id="password"
                type="password"
                placeholder="6文字以上で入力"
                autoComplete="new-password"
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード確認 *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="パスワードを再入力"
                autoComplete="new-password"
                {...form.register('confirmPassword')}
                className={
                  form.formState.errors.confirmPassword ? 'border-red-500' : ''
                }
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="山田太郎"
                {...form.register('displayName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">会社名</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="○○運送株式会社"
                {...form.register('companyName')}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登録中...' : 'アカウントを作成'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">
              既にアカウントをお持ちですか？{' '}
            </span>
            <Link
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
