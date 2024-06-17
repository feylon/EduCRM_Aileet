import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';

export class UpdateScheduleDto extends PartialType(OmitType(CreateScheduleDto, ['groupId'] as const)) {}
