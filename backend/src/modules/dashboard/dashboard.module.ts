import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceModule } from '../attendance/attendance.module';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Lesson } from '../attendance/entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';
import { GroupStudent } from '../groups/entities/group-student.entity';
import { Group } from '../groups/entities/group.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentsModule } from '../payments/payments.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Teacher, Group, GroupStudent, Course, Payment, Lead, Attendance, Lesson]),
    PaymentsModule,
    SchedulesModule,
    AttendanceModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
