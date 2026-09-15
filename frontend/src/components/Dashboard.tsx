import { useMemo, useState } from 'react';
import { useJobs } from '../hooks/useJobs';
import type { StatusFilter } from '../types/job';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { JobFilters } from './JobFilters';
import { JobForm } from './JobForm';
import { JobStats } from './JobStats';
import { JobTable } from './JobTable';
import { LoadingState } from './LoadingState';

export function Dashboard() {
  const {
    jobs,
    loading,
    error,
    notice,
    isCreating,
    updatingJobId,
    deletingJobId,
    createJob,
    updateJobStatus,
    deleteJob,
    refetch,
    dismissError,
    dismissNotice,
  } = useJobs();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const visible = useMemo(
    () => (filter === 'all' ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter],
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Queue Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, track, and transition jobs. Invalid transitions are rejected by the API.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div aria-live="polite">
        {notice && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{notice}</span>
            <button type="button" onClick={dismissNotice} aria-label="Dismiss notice" className="font-medium underline">
              Dismiss
            </button>
          </div>
        )}
        {error && !loading && (
          <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            <button type="button" onClick={dismissError} aria-label="Dismiss error" className="font-medium underline">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {!loading && !error && <JobStats jobs={jobs} />}

      <JobForm isCreating={isCreating} onCreate={createJob} />

      <section className="space-y-4">
        <JobFilters filter={filter} onChange={setFilter} />
        {loading ? (
          <LoadingState />
        ) : error && jobs.length === 0 ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : jobs.length === 0 ? (
          <EmptyState filtered={false} />
        ) : (
          <JobTable
            jobs={visible}
            filtered={filter !== 'all'}
            updatingJobId={updatingJobId}
            deletingJobId={deletingJobId}
            onUpdate={(id, s) => void updateJobStatus(id, s)}
            onDelete={(id) => void deleteJob(id)}
          />
        )}
      </section>
    </div>
  );
}
