import { apiFetch } from './client';
import type { Job, JobStatus } from '../types/job';

export function getJobs(signal?: AbortSignal): Promise<Job[]> {
  return apiFetch<Job[]>('/jobs', { signal });
}

export function createJob(input: { title: string; type: string }): Promise<Job> {
  return apiFetch<Job>('/jobs', {
    method: 'POST',
    body: JSON.stringify({ title: input.title, type: input.type }),
  });
}

export function updateJobStatus(id: string, status: JobStatus): Promise<Job> {
  return apiFetch<Job>(`/jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteJob(id: string): Promise<void> {
  return apiFetch<void>(`/jobs/${id}`, { method: 'DELETE' });
}
