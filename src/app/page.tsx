import Link from 'next/link';

const HomePage = () => {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        委託ドライバー専用・日報アプリ
      </h1>
      <p className="text-base text-gray-600 dark:text-gray-300">
        メールアドレスとパスワードでサインインして、日報を作成・編集・削除できます。
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500"
          href="/signin"
        >
          サインイン
        </Link>
        <Link
          className="rounded border border-blue-600 px-5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          href="/signup"
        >
          アカウント作成
        </Link>
      </div>
    </section>
  );
};

export default HomePage;
