import type { Job } from '../types/job';
import { EmptyState } from './EmptyState';
import { JobRow } from './JobRow';

export function JobTable({
  jobs,
  filtered,
  updatingJobId,
  deletingJobId,
  onUpdate,
  onDelete,
}: {
  jobs: Job[];
  filtered: boolean;
  updatingJobId: string | null;
  deletingJobId: string | null;
  onUpdate: (id: string, status: Job['status']) => void;
  onDelete: (id: string) => void;
}) {
  if (jobs.length === 0) return <EmptyState filtered={filtered} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Created At</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              isUpdating={updatingJobId === job.id}
              isDeleting={deletingJobId === job.id}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
