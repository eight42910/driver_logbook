import { ReportForm } from '@/components/ReportForm';

const NewReportPage = () => {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">New Report</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Fill in what you learned today. Supabase integration will save this form soon.
      </p>
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <ReportForm />
      </div>
    </section>
  );
};

export default NewReportPage;
