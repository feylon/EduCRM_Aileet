import type { ListParams, Paginated } from '@/types/api';
import type { AttendanceRecord, AttendanceSheet, AttendanceStatus, AttendanceSummary, Lesson } from '@/types/models';
import { api, cleanParams } from './http';

export interface MarkAttendancePayload {
  groupId: string;
  date: string;
  topic?: string;
  homework?: string;
  records: { studentId: string; status: AttendanceStatus; note?: string }[];
}

export const attendanceService = {
  list: (params: ListParams = {}) => api.get<Paginated<AttendanceRecord>>('/attendance', { params: cleanParams(params) }),
  lessons: (params: ListParams = {}) => api.get<Paginated<Lesson>>('/attendance/lessons', { params: cleanParams(params) }),
  sheet: (groupId: string, date: string) => api.get<AttendanceSheet>('/attendance/sheet', { params: { groupId, date } }),
  mark: (payload: MarkAttendancePayload) => api.post<AttendanceSheet>('/attendance', payload),
  mySummary: () => api.get<AttendanceSummary>('/attendance/me/summary'),
};
