import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '../enums/job-status.enum';

export class QueryJobsDto {
  @IsOptional()
  @IsEnum(JobStatus, {
    message: 'status must be one of: pending, running, completed, failed',
  })
  status?: JobStatus;
}
