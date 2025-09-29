'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const SignUpPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const supabase = createSupabaseBrowserClient();

    try {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.user && !data.session) {
        setInfoMessage(
          '確認メールを送信しました。受信箱を確認して登録を完了させてください。'
        );
        return;
      }

      router.push('/reports');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'アカウント作成に失敗しました。';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Create Account
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Start your learning journey by writing your first daily report.
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
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
        Already have an account?{' '}
        <Link className="text-blue-600 hover:underline" href="/signin">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
};

export default SignUpPage;
