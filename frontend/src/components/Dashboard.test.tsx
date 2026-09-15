import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../components/Dashboard';
import type { Job } from '../types/job';

const jobs: Job[] = [
  { id: '1', title: 'Email job', type: 'email', status: 'pending', createdAt: new Date().toISOString() },
  { id: '2', title: 'Report job', type: 'report', status: 'running', createdAt: new Date().toISOString() },
  { id: '3', title: 'Sync job', type: 'sync', status: 'completed', createdAt: new Date().toISOString() },
];

function mockFetchOnce(data: unknown, status = 200) {
  (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  // jsdom confirm
  vi.stubGlobal('confirm', () => true);
});

describe('Dashboard', () => {
  it('renders and loads jobs with correct stats', async () => {
    mockFetchOnce(jobs);
    render(<Dashboard />);

    expect(screen.getByText(/Loading jobs/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Email job')).toBeInTheDocument());
    expect(screen.getByText('Report job')).toBeInTheDocument();

    // stats: Total 3, Pending 1, Running 1, Completed 1
    expect(screen.getByLabelText('Total Jobs: 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Pending: 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Running: 1')).toBeInTheDocument();
  });

  it('filters jobs by status', async () => {
    mockFetchOnce(jobs);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Email job')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Pending' }));
    expect(screen.getByText('Email job')).toBeInTheDocument();
    expect(screen.queryByText('Report job')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Report job')).toBeInTheDocument();
  });

  it('validates create form for empty input', async () => {
    mockFetchOnce(jobs);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Email job')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Create Job' }));
    expect(await screen.findByText(/Title and type are required/i)).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1); // no POST
  });

  it('creates a job and clears the form', async () => {
    mockFetchOnce(jobs);
    const created: Job = { id: '4', title: 'New job', type: 'email', status: 'pending', createdAt: new Date().toISOString() };
    mockFetchOnce(created, 201);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Email job')).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText('Title'), 'New job');
    await userEvent.type(screen.getByLabelText('Type'), 'email');
    await userEvent.click(screen.getByRole('button', { name: 'Create Job' }));

    await waitFor(() => expect(screen.getByText('New job')).toBeInTheDocument());
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('');
  });

  it('shows only valid status actions', async () => {
    mockFetchOnce(jobs);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Email job')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Start Email job' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete Report job' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fail Report job' })).toBeInTheDocument();
    // terminal job has no Start/Complete
    const syncRow = screen.getByText('Sync job').closest('tr') as HTMLElement;
    expect(within(syncRow).queryByRole('button', { name: /Start|Complete/ })).not.toBeInTheDocument();
  });

  it('handles 409 conflict with notice and refetch', async () => {
    mockFetchOnce(jobs);
    mockFetchOnce({ statusCode: 409, message: 'Conflict' }, 409);
    const refreshed = jobs.map((j) => (j.id === '1' ? { ...j, status: 'running' as const } : j));
    mockFetchOnce(refreshed);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Email job')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Start Email job' }));
    await waitFor(() =>
      expect(screen.getByText(/updated by another request/i)).toBeInTheDocument(),
    );
  });

  it('shows error state with retry', async () => {
    mockFetchOnce({ statusCode: 500, message: 'DB down' }, 500);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText(/Unable to load jobs/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows empty state when no jobs', async () => {
    mockFetchOnce([]);
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText(/No jobs found/i)).toBeInTheDocument());
  });

  it('prevents duplicate submissions while creating', async () => {
    mockFetchOnce(jobs);
    let resolvePost!: (v: unknown) => void;
    const postPromise = new Promise((res) => {
      resolvePost = res;
    });
    (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      postPromise.then(
        () =>
          ({
            ok: true,
            status: 201,
            json: async () => ({ id: '9', title: 'Dup', type: 'email', status: 'pending', createdAt: new Date().toISOString() }),
            text: async () => '',
          }) as Response,
      ),
    );
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText('Email job')).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText('Title'), 'Dup');
    await userEvent.type(screen.getByLabelText('Type'), 'email');
    const btn = screen.getByRole('button', { name: 'Create Job' });
    await userEvent.click(btn);
    // second click while pending should not fire another POST
    await userEvent.click(screen.getByRole('button', { name: 'Creating…' }));
    resolvePost(null);
    await waitFor(() => expect(screen.getByText('Dup')).toBeInTheDocument());
    const posts = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => (c[0] as string).endsWith('/jobs') && (c[1] as RequestInit)?.method === 'POST',
    );
    expect(posts).toHaveLength(1);
  });
});
