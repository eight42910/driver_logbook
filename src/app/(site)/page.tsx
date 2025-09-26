export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Next.js + microCMS テンプレート
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          すぐに使い始められるボイラープレートプロジェクトです。
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🚀 開始するには
          </h2>
          <ol className="text-left space-y-2 text-gray-600 dark:text-gray-300">
            <li>1. microCMSアカウントを作成</li>
            <li>
              2.{' '}
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                .env.local
              </code>{' '}
              ファイルに環境変数を設定
            </li>
            <li>
              3.{' '}
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                npm install
              </code>{' '}
              を実行
            </li>
            <li>
              4.{' '}
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                npm run dev
              </code>{' '}
              で開発開始！
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
