export default function About() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          About
        </h1>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            このサイトについて紹介します。Next.jsとmicroCMSを使用したモダンなWebサイトテンプレートです。
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              技術スタック
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>🚀 Next.js 15 (App Router)</li>
              <li>🎨 Tailwind CSS</li>
              <li>📝 microCMS</li>
              <li>📦 TypeScript</li>
              <li>🎯 ESLint</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              特徴
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>✨ レスポンシブデザイン</li>
              <li>🌙 ダークモード対応</li>
              <li>⚡ 高速なパフォーマンス</li>
              <li>🔍 SEO最適化</li>
              <li>📱 PWA対応可能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
