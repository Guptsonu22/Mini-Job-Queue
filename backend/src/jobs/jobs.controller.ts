import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Job created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'List jobs' })
  findAll(@Query() query: QueryJobsDto) {
    return this.jobsService.findAll(query.status);
  }

  @Patch(':id/status')
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 409, description: 'Invalid transition or concurrency conflict' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Job deleted' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.jobsService.remove(id);
  }
}
