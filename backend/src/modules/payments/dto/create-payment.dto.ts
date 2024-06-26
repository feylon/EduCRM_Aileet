import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID('4')
  studentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  groupId?: string;

  @ApiProperty({ example: 600000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: '2024-06-26' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiProperty({ example: '2024-06' })
  @Matches(MONTH_REGEX, { message: 'forMonth must be in YYYY-MM format' })
  forMonth: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
