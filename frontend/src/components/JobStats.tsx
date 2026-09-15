import type { Job } from '../types/job';

function countBy(jobs: Job[], status: Job['status']): number {
  return jobs.filter((j) => j.status === status).length;
}

export function JobStats({ jobs }: { jobs: Job[] }) {
  const cards = [
    { label: 'Total Jobs', value: jobs.length, style: 'bg-slate-900 text-white' },
    { label: 'Pending', value: countBy(jobs, 'pending'), style: 'bg-amber-50 text-amber-900 ring-amber-200' },
    { label: 'Running', value: countBy(jobs, 'running'), style: 'bg-blue-50 text-blue-900 ring-blue-200' },
    { label: 'Completed', value: countBy(jobs, 'completed'), style: 'bg-green-50 text-green-900 ring-green-200' },
    { label: 'Failed', value: countBy(jobs, 'failed'), style: 'bg-red-50 text-red-900 ring-red-200' },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl p-4 ring-1 ring-inset ${c.style} ${c.label === 'Total Jobs' ? 'ring-slate-900' : ''}`}
        >
          <p className="text-xs font-medium uppercase tracking-wide opacity-70">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold" aria-label={`${c.label}: ${c.value}`}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
