import Link from 'next/link';
import { ReportCard } from '@/components/ReportCard';

const mockReports = [
  {
    id: '1',
    title: 'Learned Next.js layouts',
    date: '2024-05-01',
    excerpt: 'Focused on understanding the App Router and metadata.',
    hours: 1.5,
    tags: ['learning', 'nextjs'],
  },
  {
    id: '2',
    title: 'Supabase policies',
    date: '2024-05-02',
    excerpt: 'Read through RLS basics and created the reports table.',
    hours: 2,
    tags: ['supabase', 'security'],
  },
];

const ReportsPage = () => {
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Reports</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Once Supabase is configured this page will load your latest reports.
          </p>
        </div>
        <Link
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          href="/reports/new"
        >
          New Report
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {mockReports.map((report) => (
          <ReportCard key={report.id} {...report} />
        ))}
      </div>
    </section>
  );
};

export default ReportsPage;
