import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: 'title should not be empty' })
  @MaxLength(200, { message: 'title must be at most 200 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'type should not be empty' })
  @MaxLength(100, { message: 'type must be at most 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  type: string;
}
