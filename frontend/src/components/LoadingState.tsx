export function LoadingState() {
  return (
    <div role="status" aria-label="Loading jobs" className="rounded-xl border border-slate-200 bg-white p-8">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
      </div>
      <p className="mt-4 text-sm text-slate-500">Loading jobs…</p>
    </div>
  );
}
