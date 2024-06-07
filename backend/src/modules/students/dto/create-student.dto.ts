import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PHONE_REGEX, PersonDto } from '../../users/dto/create-user.dto';
import { Gender, StudentStatus } from '../entities/student.entity';

export class CreateStudentDto extends PersonDto {
  @ApiPropertyOptional({ example: '2008-04-12' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Karimov Anvar' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  parentName?: string;

  @ApiPropertyOptional({ example: '+998901112233' })
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'parentPhone must be a valid phone number' })
  parentPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsOptional()
  @IsDateString()
  enrolledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
