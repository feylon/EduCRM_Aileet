import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { GroupStudent } from './entities/group-student.entity';
import { Group } from './entities/group.entity';
import { GroupAccessService } from './group-access.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupStudent, Course, Teacher, Student])],
  controllers: [GroupsController],
  providers: [GroupsService, GroupAccessService],
  exports: [GroupsService, GroupAccessService, TypeOrmModule],
})
export class GroupsModule {}
