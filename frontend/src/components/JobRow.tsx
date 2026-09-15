import type { Job } from '../types/job';
import { formatDate } from '../utils/formatDate';
import { StatusBadge } from './StatusBadge';

export function JobRow({
  job,
  isUpdating,
  isDeleting,
  onUpdate,
  onDelete,
}: {
  job: Job;
  isUpdating: boolean;
  isDeleting: boolean;
  onUpdate: (id: string, status: Job['status']) => void;
  onDelete: (id: string) => void;
}) {
  const busy = isUpdating || isDeleting;
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3 text-sm font-medium text-slate-900">{job.title}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{job.type}</td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">{formatDate(job.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {job.status === 'pending' && (
            <button
              type="button"
              aria-label={`Start ${job.title}`}
              disabled={busy}
              onClick={() => onUpdate(job.id, 'running')}
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? 'Starting…' : 'Start'}
            </button>
          )}
          {job.status === 'running' && (
            <>
              <button
                type="button"
                aria-label={`Complete ${job.title}`}
                disabled={busy}
                onClick={() => onUpdate(job.id, 'completed')}
                className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isUpdating ? 'Working…' : 'Complete'}
              </button>
              <button
                type="button"
                aria-label={`Fail ${job.title}`}
                disabled={busy}
                onClick={() => onUpdate(job.id, 'failed')}
                className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Fail
              </button>
            </>
          )}
          {(job.status === 'completed' || job.status === 'failed') && (
            <span className="text-xs text-slate-400">—</span>
          )}
          <button
            type="button"
            aria-label={`Delete ${job.title}`}
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Delete "${job.title}"?`)) onDelete(job.id);
            }}
            className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  );
}
