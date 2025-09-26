import { getContentBySlug, getAllContents } from '@/lib/microcms';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface WorkDetailPageProps {
  params: Promise<{ slug: string }>;
}

// 静的パラメータ生成（任意）
export async function generateStaticParams() {
  try {
    const response = await getAllContents('works', 100);
    return response.contents.map((work: any) => ({
      slug: work.slug,
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

// メタデータ生成
export async function generateMetadata({
  params,
}: WorkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const work = await getContentBySlug('works', slug);

    if (!work) {
      return {
        title: 'Work Not Found',
      };
    }

    return {
      title: work.title,
      description: work.description || `${work.title}の詳細ページです。`,
    };
  } catch (error) {
    return {
      title: 'Work Detail',
    };
  }
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { slug } = await params;

  try {
    const work = await getContentBySlug('works', slug);

    if (!work) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* パンくずナビ */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <a
                  href="/"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Home
                </a>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li>
                <a
                  href="/works"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Works
                </a>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li className="text-gray-900 dark:text-gray-100">{work.title}</li>
            </ol>
          </nav>

          {/* ヘッダー */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {work.title}
            </h1>
            {work.publishedAt && (
              <time className="text-gray-500 dark:text-gray-400">
                {new Date(work.publishedAt).toLocaleDateString('ja-JP')}
              </time>
            )}
          </header>

          {/* アイキャッチ画像 */}
          {work.eyecatch && (
            <div className="mb-8">
              <img
                src={work.eyecatch.url}
                alt={work.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* コンテンツ */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {work.content && (
              <div dangerouslySetInnerHTML={{ __html: work.content }} />
            )}

            {work.description && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-8">
                <p className="text-gray-600 dark:text-gray-300">
                  {work.description}
                </p>
              </div>
            )}
          </div>

          {/* 戻るボタン */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <a
              href="/works"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              ← Works一覧に戻る
            </a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch work:', error);
    notFound();
  }
}
