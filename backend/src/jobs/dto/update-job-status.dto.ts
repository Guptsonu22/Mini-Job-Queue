import { IsEnum } from 'class-validator';
import { JobStatus } from '../enums/job-status.enum';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus, {
    message: 'status must be one of: pending, running, completed, failed',
  })
  status: JobStatus;
}
