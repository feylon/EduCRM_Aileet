import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { StudentStatus } from '../entities/student.entity';

export class QueryStudentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ description: 'Only students of this group' })
  @IsOptional()
  @IsUUID('4')
  groupId?: string;
}
