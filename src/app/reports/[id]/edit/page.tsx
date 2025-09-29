import Link from 'next/link';
import { ReportForm } from '@/components/ReportForm';

const EditReportPage = ({ params }: { params: { id: string } }) => {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Edit Report
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Load the existing report, edit, and save back to Supabase.
          </p>
        </div>
        <Link className="text-sm text-blue-600 hover:underline" href={`/reports/${params.id}`}>
          Back to detail
        </Link>
      </div>
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <ReportForm />
      </div>
    </section>
  );
};

export default EditReportPage;
