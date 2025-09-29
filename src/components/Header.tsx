import Link from 'next/link';

export const Header = () => {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-white">
          Driver Logbook
        </Link>
        <nav>
          <ul className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <li>
              <Link className="hover:text-gray-900 dark:hover:text-white" href="/reports">
                Reports
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-900 dark:hover:text-white" href="/reports/new">
                New Report
              </Link>
            </li>
            <li>
              <Link className="hover:text-gray-900 dark:hover:text-white" href="/signin">
                Sign In
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
