import { JobStatus } from '../enums/job-status.enum';

export const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.RUNNING],
  [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.FAILED]: [],
};

export function isAllowedTransition(from: JobStatus, to: JobStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
