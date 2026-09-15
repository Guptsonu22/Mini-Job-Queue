export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
}

export type StatusFilter = 'all' | JobStatus;

export const STATUSES: JobStatus[] = ['pending', 'running', 'completed', 'failed'];
