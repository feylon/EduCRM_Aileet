import type { ListParams, Paginated } from '@/types/api';
import type { Payment, PaymentMethod, PaymentStatus, StudentDebt } from '@/types/models';
import { createCrudService } from './crud';
import { api, cleanParams } from './http';

export interface PaymentPayload {
  studentId: string;
  groupId?: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string;
  forMonth: string;
  note?: string;
}

export interface PaymentSummary {
  total: number;
  count: number;
  byMethod: { method: PaymentMethod; total: number; count: number }[];
}

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'transfer', 'click', 'payme'];

export const paymentsService = {
  ...createCrudService<Payment, PaymentPayload, Omit<Partial<PaymentPayload>, 'studentId'>>('/payments'),
  summary: (params: ListParams = {}) => api.get<PaymentSummary>('/payments/summary', { params: cleanParams(params) }),
  debtors: (params: ListParams = {}) => api.get<Paginated<StudentDebt>>('/payments/debtors', { params: cleanParams(params) }),
  balance: (studentId: string) => api.get<StudentDebt | null>(`/payments/students/${studentId}/balance`),
  mine: (params: ListParams = {}) =>
    api.get<Paginated<Payment> & { balance: StudentDebt | null }>('/payments/me', { params: cleanParams(params) }),
};
