import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PersonDto } from './create-user.dto';

export const LANGUAGES = ['uz', 'ru', 'en'];

export class UpdateProfileDto extends PartialType(
  PickType(PersonDto, ['firstName', 'lastName', 'phone'] as const),
) {
  @ApiPropertyOptional({ enum: LANGUAGES })
  @IsOptional()
  @IsIn(LANGUAGES)
  language?: string;
}
