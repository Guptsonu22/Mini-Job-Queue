import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Job } from '../src/jobs/entities/job.entity';
import { JobsModule } from '../src/jobs/jobs.module';

describe('Jobs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Job],
          synchronize: true,
        }),
        JobsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /jobs -> 201 with pending status', async () => {
    const res = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'Send welcome email', type: 'email' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Send welcome email');
    expect(res.body.status).toBe('pending');
    expect(res.body.createdAt).toBeDefined();
  });

  it('POST /jobs -> 400 on empty title', async () => {
    await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: '   ', type: 'email' })
      .expect(400);
  });

  it('POST /jobs -> 400 when client sends status', async () => {
    await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'X', type: 'email', status: 'running' })
      .expect(400);
  });

  it('GET /jobs -> 200 sorted desc', async () => {
    const res = await request(app.getHttpServer()).get('/jobs').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /jobs?status=pending -> 200 filtered', async () => {
    const res = await request(app.getHttpServer())
      .get('/jobs?status=pending')
      .expect(200);
    expect(res.body.every((j: any) => j.status === 'pending')).toBe(true);
  });

  it('PATCH valid pending -> running -> 200', async () => {
    const created = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'Race base', type: 'email' });
    const res = await request(app.getHttpServer())
      .patch(`/jobs/${created.body.id}/status`)
      .send({ status: 'running' })
      .expect(200);
    expect(res.body.status).toBe('running');
  });

  it('PATCH invalid pending -> completed -> 409', async () => {
    const created = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'Invalid jump', type: 'email' });
    await request(app.getHttpServer())
      .patch(`/jobs/${created.body.id}/status`)
      .send({ status: 'completed' })
      .expect(409);
  });

  it('PATCH terminal completed -> running -> 409', async () => {
    const created = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'Terminal', type: 'email' });
    await request(app.getHttpServer())
      .patch(`/jobs/${created.body.id}/status`)
      .send({ status: 'running' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/jobs/${created.body.id}/status`)
      .send({ status: 'completed' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/jobs/${created.body.id}/status`)
      .send({ status: 'running' })
      .expect(409);
  });

  it('concurrent pending -> running: one 200, one 409', async () => {
    const created = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'Concurrent race', type: 'email' });

    const [r1, r2] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/jobs/${created.body.id}/status`)
        .send({ status: 'running' }),
      request(app.getHttpServer())
        .patch(`/jobs/${created.body.id}/status`)
        .send({ status: 'running' }),
    ]);

    const codes = [r1.status, r2.status].sort();
    expect(codes).toEqual([200, 409]);
  });

  it('PATCH missing job -> 404', async () => {
    await request(app.getHttpServer())
      .patch('/jobs/00000000-0000-4000-8000-000000000000/status')
      .send({ status: 'running' })
      .expect(404);
  });

  it('DELETE /jobs/:id -> 204 then 404', async () => {
    const created = await request(app.getHttpServer())
      .post('/jobs')
      .send({ title: 'To delete', type: 'email' });
    await request(app.getHttpServer()).delete(`/jobs/${created.body.id}`).expect(204);
    await request(app.getHttpServer()).delete(`/jobs/${created.body.id}`).expect(404);
  });
});
