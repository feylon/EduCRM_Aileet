import type { PaymentMethod } from '@/types/models';
import { api, cleanParams, http } from './http';

export interface ReportPeriod {
  from?: string;
  to?: string;
  groupId?: string;
}

export interface FinanceReport {
  period: { from: string; to: string };
  total: number;
  count: number;
  refunded: number;
  byMethod: { method: PaymentMethod; total: number; count: number }[];
  byMonth: { month: string; total: number }[];
  byCourse: { course: string; total: number; count: number }[];
}

export interface AttendanceReport {
  period: { from: string; to: string };
  overall: { present: number; late: number; absent: number; excused: number; rate: number };
  groups: {
    groupId: string;
    groupName: string;
    courseName: string;
    teacherName: string | null;
    lessons: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    rate: number;
  }[];
}

export interface TeachersReport {
  period: { from: string; to: string };
  teachers: { teacherId: string; teacherName: string; groups: number; students: number; lessons: number }[];
}

export interface StudentsReport {
  byStatus: { status: string; count: number }[];
  byCourse: { course: string; count: number }[];
  byGender: { gender: string; count: number }[];
}

export const reportsService = {
  finance: (period: ReportPeriod) => api.get<FinanceReport>('/reports/finance', { params: cleanParams(period) }),
  attendance: (period: ReportPeriod) => api.get<AttendanceReport>('/reports/attendance', { params: cleanParams(period) }),
  teachers: (period: ReportPeriod) => api.get<TeachersReport>('/reports/teachers', { params: cleanParams(period) }),
  students: () => api.get<StudentsReport>('/reports/students'),
  /** Downloads the payments CSV through the authenticated client. */
  async exportPayments(period: ReportPeriod) {
    const response = await http.get<Blob>('/reports/payments/export', { params: cleanParams(period), responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments_${period.from}_${period.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
