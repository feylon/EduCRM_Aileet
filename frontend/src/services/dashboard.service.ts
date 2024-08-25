import type { AttendanceSummary, Group, GroupBalance, Payment, Schedule } from '@/types/models';
import { api } from './http';

export interface AdminStatistics {
  students: { total: number; active: number; newThisMonth: number };
  teachers: number;
  groups: { total: number; active: number };
  courses: number;
  revenue: { currentMonth: number; previousMonth: number };
  debts: { total: number; debtors: number };
  newLeads: number;
  todayLessons: number;
}

export interface DashboardCharts {
  revenue: { month: string; total: number }[];
  newStudents: { month: string; count: number }[];
  attendance: { month: string; present: number; late: number; absent: number; excused: number; rate: number }[];
  leadSources: { source: string; total: number; converted: number }[];
  leadFunnel: { status: string; count: number }[];
  studentsByCourse: { course: string; color: string; count: number }[];
}

export interface TeacherDashboard {
  groups: Group[];
  groupsCount: number;
  studentsCount: number;
  todayLessons: Schedule[];
  lessonsThisMonth: number;
  attendanceRate: number;
}

export interface StudentDashboard {
  groups: Group[];
  attendance: AttendanceSummary;
  balance: { totalDebt: number; groups: GroupBalance[] };
  todayLessons: Schedule[];
  recentPayments: Payment[];
  currentMonth: string;
}

export const dashboardService = {
  statistics: () => api.get<AdminStatistics>('/dashboard/statistics'),
  charts: () => api.get<DashboardCharts>('/dashboard/charts'),
  teacher: () => api.get<TeacherDashboard>('/dashboard/teacher'),
  student: () => api.get<StudentDashboard>('/dashboard/student'),
  today: () => api.get<Schedule[]>('/schedules/today'),
};
