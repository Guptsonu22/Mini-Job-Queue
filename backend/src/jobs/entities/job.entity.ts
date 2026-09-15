import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { JobStatus } from '../enums/job-status.enum';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 100 })
  type: string;

  @Index()
  @Column({ type: 'text', default: JobStatus.PENDING })
  status: JobStatus;

  @CreateDateColumn()
  createdAt: Date;
}
