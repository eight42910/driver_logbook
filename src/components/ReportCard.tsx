type ReportCardProps = {
  title: string;
  date: string;
  excerpt: string;
  hours?: number;
  tags?: string[];
};

export const ReportCard = ({ title, date, excerpt, hours, tags = [] }: ReportCardProps) => {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <time className="text-xs text-gray-500 dark:text-gray-400">{date}</time>
      </header>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{excerpt}</p>
      <footer className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        {hours !== undefined && <span>{hours.toFixed(1)} h</span>}
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-blue-200 px-2 py-1 text-blue-600 dark:border-blue-800 dark:text-blue-300"
          >
            #{tag}
          </span>
        ))}
      </footer>
    </article>
  );
};
