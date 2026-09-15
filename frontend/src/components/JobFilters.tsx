import type { StatusFilter } from '../types/job';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export function JobFilters({
  filter,
  onChange,
}: {
  filter: StatusFilter;
  onChange: (f: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter jobs by status">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => onChange(f.value)}
          aria-pressed={filter === f.value}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset ${
            filter === f.value
              ? 'bg-slate-900 text-white ring-slate-900'
              : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
