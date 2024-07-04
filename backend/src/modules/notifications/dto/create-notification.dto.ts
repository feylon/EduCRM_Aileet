import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

/** Announcement sent by an administrator to roles and/or specific users. */
export class CreateNotificationDto {
  @ApiProperty({ example: 'Holiday' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'The center will be closed on Monday.' })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ enum: Role, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  userIds?: string[];
}
