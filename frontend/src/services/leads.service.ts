import type { Lead, LeadSource, LeadStatus } from '@/types/models';
import { createCrudService } from './crud';
import { api } from './http';

export interface LeadPayload {
  fullName: string;
  phone: string;
  email?: string;
  source?: LeadSource;
  status?: LeadStatus;
  courseId?: string | null;
  assignedToId?: string | null;
  note?: string;
  nextContactAt?: string | null;
  lostReason?: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  conversionRate: number;
}

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'trial', 'converted', 'lost'];
export const LEAD_SOURCES: LeadSource[] = ['instagram', 'telegram', 'facebook', 'website', 'referral', 'phone_call', 'walk_in', 'other'];

export const leadsService = {
  ...createCrudService<Lead, LeadPayload>('/leads'),
  stats: () => api.get<LeadStats>('/leads/stats'),
  convert: (id: string, payload: { firstName: string; lastName: string; email: string; password: string; groupId?: string }) =>
    api.post<Lead>(`/leads/${id}/convert`, payload),
};
