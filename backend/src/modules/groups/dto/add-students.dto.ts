import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AddStudentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  studentIds: string[];

  @ApiPropertyOptional({ example: '2024-06-10' })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;
}
