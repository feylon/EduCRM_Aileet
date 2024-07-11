import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Attendance, Student, Teacher, Course])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
