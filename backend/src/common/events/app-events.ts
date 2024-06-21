/**
 * Domain events published inside the monolith via @nestjs/event-emitter.
 * Modules communicate through these events instead of calling each other directly,
 * which keeps them decoupled (and easy to move to a message broker later).
 */
export const AppEvents = {
  STUDENT_CHANGED: 'student.changed',
  GROUP_CHANGED: 'group.changed',
  ATTENDANCE_MARKED: 'attendance.marked',
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_CHANGED: 'payment.changed',
  LEAD_CHANGED: 'lead.changed',
  LEAD_ASSIGNED: 'lead.assigned',
} as const;

export interface AttendanceMarkedEvent {
  lessonId: string;
  groupId: string;
  groupName: string;
  date: string;
  absentStudentUserIds: string[];
}

export interface PaymentCreatedEvent {
  paymentId: string;
  studentUserId: string;
  amount: number;
  forMonth: string;
  groupName: string | null;
}

export interface LeadAssignedEvent {
  leadId: string;
  leadName: string;
  assigneeUserId: string;
}
