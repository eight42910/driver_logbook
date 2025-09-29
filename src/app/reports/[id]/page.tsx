import Link from 'next/link';

const ReportDetailPage = ({ params }: { params: { id: string } }) => {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Report #{params.id}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This placeholder will display the selected report once Supabase queries are ready.
          </p>
        </div>
        <Link
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          href={`/reports/${params.id}/edit`}
        >
          Edit Report
        </Link>
      </header>
      <section className="mt-6 space-y-4 text-sm text-gray-700 dark:text-gray-200">
        <p>Date: 2024-05-01</p>
        <p>Hours: 1.5</p>
        <p>Tags: learning, nextjs</p>
        <p>
          Body:
          <br />
          Coming soon: render markdown body content stored in Supabase.
        </p>
      </section>
    </article>
  );
};

export default ReportDetailPage;
