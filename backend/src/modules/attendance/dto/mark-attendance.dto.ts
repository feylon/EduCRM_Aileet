import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class AttendanceRecordDto {
  @ApiProperty()
  @IsUUID('4')
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}

export class MarkAttendanceDto {
  @ApiProperty()
  @IsUUID('4')
  groupId: string;

  @ApiProperty({ example: '2024-06-21' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Present Perfect' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  homework?: string;

  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
