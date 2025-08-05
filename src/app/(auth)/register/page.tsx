'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Mail, Lock, UserPlus } from 'lucide-react';

// バリデーションスキーマ
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'メールアドレスは必須です')
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(6, 'パスワードは6文字以上で入力してください')
      .max(128, 'パスワードは128文字以下で入力してください'),
    confirmPassword: z.string().min(1, 'パスワード確認は必須です'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * 新規登録ページ
 *
 * 機能：
 * - メールアドレス・パスワードでの新規登録
 * - パスワード確認機能
 * - フォームバリデーション
 * - エラーハンドリング
 * - ログインページへのリンク
 */
export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  // 新規登録処理
  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await signUp(data.email, data.password);

      // 登録成功メッセージ
      setSuccessMessage(
        'アカウントが作成されました。メールアドレスの確認メールをお送りしましたので、' +
          'メール内のリンクをクリックしてアカウントを有効化してください。'
      );

      // 5秒後にログインページにリダイレクト
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } catch (error) {
      console.error('新規登録エラー:', error);

      // エラーメッセージの表示
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('このメールアドレスは既に登録されています');
        } else if (
          error.message.includes('Password should be at least 6 characters')
        ) {
          setErrorMessage('パスワードは6文字以上で入力してください');
        } else if (error.message.includes('Unable to validate email address')) {
          setErrorMessage('メールアドレスの形式が正しくありません');
        } else {
          setErrorMessage(
            'アカウント作成に失敗しました。時間をおいて再度お試しください'
          );
        }
      } else {
        setErrorMessage('不明なエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Driver Logbook v3
          </h1>
          <p className="text-gray-600">ドライバー業務効率化システム</p>
        </div>

        {/* 新規登録フォーム */}
        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" />
              新規登録
            </CardTitle>
            <CardDescription className="text-center">
              新しいアカウントを作成してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* エラーメッセージ */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {errorMessage}
                </div>
              )}

              {/* 成功メッセージ */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {successMessage}
                </div>
              )}

              {/* メールアドレス */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  メールアドレス
                </Label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@domain.com"
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isLoading || !!successMessage}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* パスワード */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  パスワード
                </Label>
                <Input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="6文字以上のパスワード"
                  className={errors.password ? 'border-red-500' : ''}
                  disabled={isLoading || !!successMessage}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* パスワード確認 */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  パスワード確認
                </Label>
                <Input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="パスワードを再入力"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  disabled={isLoading || !!successMessage}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* 登録ボタン */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !!successMessage}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    アカウント作成中...
                  </>
                ) : successMessage ? (
                  '登録完了'
                ) : (
                  'アカウント作成'
                )}
              </Button>
            </form>

            {/* ログインリンク */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                既にアカウントをお持ちの方は{' '}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  ログイン
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 利用規約・プライバシーポリシー */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            アカウント作成により、
            <a href="#" className="text-blue-600 hover:underline">
              利用規約
            </a>
            および
            <a href="#" className="text-blue-600 hover:underline">
              プライバシーポリシー
            </a>
            に同意したものとみなします。
          </p>
        </div>

        {/* フッター */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 Driver Logbook v3. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
