import type { JobStatus } from '../types/job';

const STYLES: Record<JobStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  running: 'bg-blue-100 text-blue-800 ring-blue-200',
  completed: 'bg-green-100 text-green-800 ring-green-200',
  failed: 'bg-red-100 text-red-800 ring-red-200',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
