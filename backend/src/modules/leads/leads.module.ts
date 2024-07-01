import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsModule } from '../groups/groups.module';
import { StudentsModule } from '../students/students.module';
import { User } from '../users/entities/user.entity';
import { Lead } from './entities/lead.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, User]), StudentsModule, GroupsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
