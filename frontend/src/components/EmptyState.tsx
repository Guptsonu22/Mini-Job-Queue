export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-medium text-slate-800">
        {filtered ? 'No jobs match this filter.' : 'No jobs found.'}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {filtered ? 'Try a different status filter.' : 'Create your first job to get started.'}
      </p>
    </div>
  );
}
