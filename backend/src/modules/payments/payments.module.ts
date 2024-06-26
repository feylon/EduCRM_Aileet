import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupStudent } from '../groups/entities/group-student.entity';
import { Student } from '../students/entities/student.entity';
import { DebtsService } from './debts.service';
import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Student, GroupStudent])],
  controllers: [PaymentsController],
  providers: [PaymentsService, DebtsService],
  exports: [PaymentsService, DebtsService],
})
export class PaymentsModule {}
