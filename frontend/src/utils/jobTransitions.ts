import type { JobStatus } from '../types/job';

/** Mirror of backend ALLOWED_TRANSITIONS — UX only. Backend is source of truth. */
const ALLOWED: Record<JobStatus, JobStatus[]> = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

export function getAllowedTransitions(status: JobStatus): JobStatus[] {
  return ALLOWED[status] ?? [];
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return getAllowedTransitions(from).includes(to);
}
