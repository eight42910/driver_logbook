'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const SignUpPage = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    console.log('TODO: call Supabase sign up');
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Account</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Start your learning journey by writing your first daily report.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
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
