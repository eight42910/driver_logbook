import Link from 'next/link';

export const Header = () => {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Your Site Name
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link
                  href="/"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Home
                </Link>
              </li>
              {/* 必要に応じてナビゲーションアイテムを追加 */}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};
