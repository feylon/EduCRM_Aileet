import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AppEvents,
  AttendanceMarkedEvent,
  LeadAssignedEvent,
  PaymentCreatedEvent,
} from '../../common/events/app-events';
import { NotificationType } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

/** Turns domain events into in-app notifications. */
@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(AppEvents.PAYMENT_CREATED, { async: true })
  async onPaymentCreated(event: PaymentCreatedEvent) {
    await this.safe(() =>
      this.notificationsService.notify([event.studentUserId], NotificationType.PAYMENT_RECEIVED, {
        amount: event.amount,
        forMonth: event.forMonth,
        groupName: event.groupName,
      }),
    );
  }

  @OnEvent(AppEvents.ATTENDANCE_MARKED, { async: true })
  async onAttendanceMarked(event: AttendanceMarkedEvent) {
    await this.safe(() =>
      this.notificationsService.notify(event.absentStudentUserIds, NotificationType.ABSENCE, {
        groupName: event.groupName,
        date: event.date,
      }),
    );
  }

  @OnEvent(AppEvents.LEAD_ASSIGNED, { async: true })
  async onLeadAssigned(event: LeadAssignedEvent) {
    await this.safe(() =>
      this.notificationsService.notify([event.assigneeUserId], NotificationType.LEAD_ASSIGNED, {
        leadId: event.leadId,
        leadName: event.leadName,
      }),
    );
  }

  private async safe(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      this.logger.error(`Failed to create notification: ${(error as Error).message}`);
    }
  }
}
