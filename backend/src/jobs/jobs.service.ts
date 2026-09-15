import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { JobStatus } from './enums/job-status.enum';
import { Job } from './entities/job.entity';
import { isAllowedTransition } from './constants/job-transitions';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepo: Repository<Job>,
  ) {}

  create(dto: CreateJobDto): Promise<Job> {
    const job = this.jobsRepo.create({
      title: dto.title,
      type: dto.type,
      status: JobStatus.PENDING,
    });
    return this.jobsRepo.save(job);
  }

  findAll(status?: JobStatus): Promise<Job[]> {
    return this.jobsRepo.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, next: JobStatus): Promise<Job> {
    const current = await this.jobsRepo.findOne({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    if (current.status === next) {
      throw new ConflictException(
        `Job is already ${next}. Same-status updates are rejected`,
      );
    }

    if (!isAllowedTransition(current.status, next)) {
      throw new ConflictException(
        `Invalid status transition from ${current.status} to ${next}`,
      );
    }

    // Atomic conditional update: only succeeds if row still has the
    // expected previous status. This is a single SQL statement:
    //   UPDATE jobs SET status=? WHERE id=? AND status=?
    // The database executes it atomically, so two concurrent requests
    // cannot both succeed. One gets affected=1, the other affected=0.
    let affected = 0;
    try {
      const res = await this.jobsRepo.update(
        { id, status: current.status },
        { status: next },
      );
      affected = res.affected ?? 0;
    } catch (err: any) {
      if (err?.code === 'SQLITE_BUSY') {
        throw new ConflictException(
          'Job was updated concurrently, please refetch',
        );
      }
      throw err;
    }

    if (affected === 0) {
      const latest = await this.jobsRepo.findOne({ where: { id } });
      if (!latest) {
        throw new NotFoundException(`Job ${id} not found`);
      }
      throw new ConflictException(
        `Conflict: job is now ${latest.status}, cannot move to ${next}`,
      );
    }

    return (await this.jobsRepo.findOne({ where: { id } }))!;
  }

  async remove(id: string): Promise<void> {
    const res = await this.jobsRepo.delete(id);
    if ((res.affected ?? 0) === 0) {
      throw new NotFoundException(`Job ${id} not found`);
    }
  }
}
