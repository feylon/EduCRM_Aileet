import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

/** Shared personal fields used by users, students and teachers. */
export class PersonDto {
  @ApiProperty({ example: 'Aziz' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Karimov' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'aziz@educrm.uz' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'phone must be a valid phone number' })
  phone?: string;

  @ApiProperty({ example: 'Secret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string;
}

export class CreateUserDto extends PersonDto {
  @ApiProperty({ enum: [Role.ADMIN, Role.SUPER_ADMIN] })
  @IsIn([Role.ADMIN, Role.SUPER_ADMIN])
  role: Role;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
