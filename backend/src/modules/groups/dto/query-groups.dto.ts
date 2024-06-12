import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { GroupStatus } from '../entities/group.entity';

export class QueryGroupsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  courseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  teacherId?: string;

  @ApiPropertyOptional({ enum: GroupStatus })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}
