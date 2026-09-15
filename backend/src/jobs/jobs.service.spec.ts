import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { JobStatus } from './enums/job-status.enum';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: repo },
      ],
    }).compile();
    service = module.get<JobsService>(JobsService);
  });

  it('creates a job with pending status', async () => {
    repo.create.mockReturnValue({ title: 'Email', type: 'email' });
    repo.save.mockResolvedValue({ id: '1', status: JobStatus.PENDING });
    const result: any = await service.create({ title: 'Email', type: 'email' } as any);
    expect(repo.create).toHaveBeenCalledWith({
      title: 'Email',
      type: 'email',
      status: JobStatus.PENDING,
    });
    expect(result.status).toBe(JobStatus.PENDING);
  });

  it('returns jobs ordered query passthrough', async () => {
    repo.find.mockResolvedValue([{ id: '1' }]);
    const jobs = await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({
      where: {},
      order: { createdAt: 'DESC' },
    });
    expect(jobs).toHaveLength(1);
  });

  it('allows pending -> running with atomic conditional update', async () => {
    repo.findOne
      .mockResolvedValueOnce({ id: '1', status: JobStatus.PENDING })
      .mockResolvedValueOnce({ id: '1', status: JobStatus.RUNNING });
    repo.update.mockResolvedValue({ affected: 1 });

    const result = await service.updateStatus('1', JobStatus.RUNNING);

    expect(repo.update).toHaveBeenCalledWith(
      { id: '1', status: JobStatus.PENDING },
      { status: JobStatus.RUNNING },
    );
    expect(result.status).toBe(JobStatus.RUNNING);
  });

  it('rejects pending -> completed with 409', async () => {
    repo.findOne.mockResolvedValue({ id: '1', status: JobStatus.PENDING });
    await expect(service.updateStatus('1', JobStatus.COMPLETED)).rejects.toThrow(
      ConflictException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rejects completed -> running with 409', async () => {
    repo.findOne.mockResolvedValue({ id: '1', status: JobStatus.COMPLETED });
    await expect(service.updateStatus('1', JobStatus.RUNNING)).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects failed -> running with 409', async () => {
    repo.findOne.mockResolvedValue({ id: '1', status: JobStatus.FAILED });
    await expect(service.updateStatus('1', JobStatus.RUNNING)).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects same-status update with 409', async () => {
    repo.findOne.mockResolvedValue({ id: '1', status: JobStatus.RUNNING });
    await expect(service.updateStatus('1', JobStatus.RUNNING)).rejects.toThrow(
      ConflictException,
    );
  });

  it('returns 409 when concurrent update wins (affected 0)', async () => {
    repo.findOne
      .mockResolvedValueOnce({ id: '1', status: JobStatus.PENDING })
      .mockResolvedValueOnce({ id: '1', status: JobStatus.RUNNING });
    repo.update.mockResolvedValue({ affected: 0 });

    await expect(service.updateStatus('1', JobStatus.RUNNING)).rejects.toThrow(
      ConflictException,
    );
  });

  it('throws 404 when job does not exist', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.updateStatus('missing', JobStatus.RUNNING)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deletes a job', async () => {
    repo.delete.mockResolvedValue({ affected: 1 });
    await service.remove('1');
    expect(repo.delete).toHaveBeenCalledWith('1');
  });

  it('throws 404 when deleting missing job', async () => {
    repo.delete.mockResolvedValue({ affected: 0 });
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
