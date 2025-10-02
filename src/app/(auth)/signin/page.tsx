'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
const SignInPage = () => {
  //ページ遷移のためにuseRouterを使用
  const router = useRouter();
  //ローディング状態を管理
  const [loading, setLoading] = useState(false);
  //エラーメッセージを管理
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push('/reports');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'サインインに失敗しました。';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="mx-auto mt-12 w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Sign In
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Enter your email and password to access your daily reports.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
        No account yet?{' '}
        <Link className="text-blue-600 hover:underline" href="/signup">
          新規登録
        </Link>
      </p>
    </div>
  );
};

export default SignInPage;
