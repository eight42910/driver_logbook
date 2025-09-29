export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          &copy; {year} Driver Logbook. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
