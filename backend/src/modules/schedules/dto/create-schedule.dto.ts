import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID('4')
  groupId: string;

  @ApiProperty({ minimum: 1, maximum: 7, description: '1 = Monday ... 7 = Sunday' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ example: '14:00' })
  @Matches(TIME_REGEX, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '15:30' })
  @Matches(TIME_REGEX, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ example: '201' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  room?: string;
}
