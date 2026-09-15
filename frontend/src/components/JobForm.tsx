import { useState } from 'react';

export function JobForm({
  isCreating,
  onCreate,
}: {
  isCreating: boolean;
  onCreate: (title: string, type: string) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const ty = type.trim();
    if (!t || !ty) {
      setFormError('Title and type are required.');
      return;
    }
    if (t.length > 200 || ty.length > 100) {
      setFormError('Title must be ≤200 chars and type ≤100 chars.');
      return;
    }
    setFormError(null);
    const ok = await onCreate(t, ty);
    if (ok) {
      setTitle('');
      setType('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 className="text-base font-semibold text-slate-900">Create New Job</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="job-title" className="block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="job-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Send welcome email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="job-type" className="block text-sm font-medium text-slate-700">
            Type
          </label>
          <input
            id="job-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            maxLength={100}
            placeholder="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>
      {formError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={isCreating}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreating ? 'Creating…' : 'Create Job'}
      </button>
    </form>
  );
}
