import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GroupStatus } from '../entities/group.entity';

export class CreateGroupDto {
  @ApiProperty({ example: 'IELTS-01' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsUUID('4')
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  teacherId?: string | null;

  @ApiPropertyOptional({ example: '201' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  room?: string;

  @ApiProperty({ example: '2024-06-10' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2024-12-10' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: GroupStatus })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxStudents?: number;
}
