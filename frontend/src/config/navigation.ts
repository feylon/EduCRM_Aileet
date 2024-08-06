import {
  AcademicCapIcon,
  BanknotesIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  FunnelIcon,
  HomeIcon,
  PresentationChartBarIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/vue/24/outline';
import type { Component } from 'vue';
import type { Role } from '@/types/models';

export interface NavItem {
  /** Route name */
  name: string;
  /** i18n key */
  label: string;
  icon: Component;
  roles?: Role[];
}

export interface NavSection {
  /** i18n key, optional section heading */
  title?: string;
  items: NavItem[];
}

const STAFF: Role[] = ['admin'];

/** Sidebar navigation. Items are filtered by role (super admin sees everything). */
export const navigation: NavSection[] = [
  {
    items: [{ name: 'dashboard', label: 'nav.dashboard', icon: HomeIcon }],
  },
  {
    title: 'nav.sections.education',
    items: [
      { name: 'students', label: 'nav.students', icon: UsersIcon, roles: [...STAFF, 'teacher'] },
      { name: 'teachers', label: 'nav.teachers', icon: AcademicCapIcon, roles: STAFF },
      { name: 'courses', label: 'nav.courses', icon: BookOpenIcon, roles: STAFF },
      { name: 'groups', label: 'nav.groups', icon: UserGroupIcon },
      { name: 'schedule', label: 'nav.schedule', icon: CalendarDaysIcon },
      { name: 'attendance', label: 'nav.attendance', icon: ClipboardDocumentCheckIcon, roles: [...STAFF, 'teacher'] },
      { name: 'my-attendance', label: 'nav.myAttendance', icon: ClipboardDocumentCheckIcon, roles: ['student'] },
    ],
  },
  {
    title: 'nav.sections.business',
    items: [
      { name: 'payments', label: 'nav.payments', icon: BanknotesIcon, roles: STAFF },
      { name: 'my-payments', label: 'nav.myPayments', icon: BanknotesIcon, roles: ['student'] },
      { name: 'leads', label: 'nav.leads', icon: FunnelIcon, roles: STAFF },
      { name: 'reports', label: 'nav.reports', icon: PresentationChartBarIcon, roles: STAFF },
    ],
  },
  {
    title: 'nav.sections.administration',
    items: [{ name: 'users', label: 'nav.users', icon: ShieldCheckIcon, roles: ['super_admin'] }],
  },
];
