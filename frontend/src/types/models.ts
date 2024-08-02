/** Domain models returned by the API. */

export type Role = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface Timestamps {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends Timestamps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  language: string;
  lastLoginAt: string | null;
}

export type CourseLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

export interface Course extends Timestamps {
  name: string;
  description: string | null;
  price: number;
  durationMonths: number;
  lessonsPerWeek: number;
  level: CourseLevel;
  color: string;
  isActive: boolean;
  groupsCount?: number;
}

export interface Teacher extends Timestamps {
  userId: string;
  user: User;
  specialization: string | null;
  bio: string | null;
  experienceYears: number;
  hireDate: string | null;
  salary: number | null;
  courses: Course[];
  courseIds: string[];
  groupsCount?: number;
}

export type StudentStatus = 'active' | 'frozen' | 'graduated' | 'left';
export type Gender = 'male' | 'female';

export interface GroupLink extends Timestamps {
  groupId: string;
  studentId: string;
  joinedAt: string;
  leftAt: string | null;
  status: 'active' | 'left';
  group?: Group;
  student?: Student;
}

export interface Student extends Timestamps {
  userId: string;
  user: User;
  birthDate: string | null;
  gender: Gender | null;
  parentName: string | null;
  parentPhone: string | null;
  address: string | null;
  status: StudentStatus;
  enrolledAt: string;
  notes: string | null;
  groupLinks?: GroupLink[];
}

export type GroupStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface Schedule extends Timestamps {
  groupId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  group?: Group;
}

export interface Group extends Timestamps {
  name: string;
  courseId: string;
  course: Course;
  teacherId: string | null;
  teacher: Teacher | null;
  room: string | null;
  startDate: string;
  endDate: string | null;
  status: GroupStatus;
  maxStudents: number;
  studentsCount?: number;
  schedules?: Schedule[];
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Lesson extends Timestamps {
  groupId: string;
  group?: Group;
  date: string;
  topic: string | null;
  homework: string | null;
  teacher?: Teacher | null;
  presentCount?: number;
  totalCount?: number;
}

export interface AttendanceRecord extends Timestamps {
  lessonId: string;
  lesson: Lesson;
  studentId: string;
  student: Student;
  status: AttendanceStatus;
  note: string | null;
}

export interface AttendanceSheet {
  groupId: string;
  date: string;
  lesson: { id: string; topic: string | null; homework: string | null } | null;
  records: {
    studentId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: AttendanceStatus | null;
    note: string | null;
  }[];
}

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'click' | 'payme';
export type PaymentStatus = 'paid' | 'refunded';

export interface Payment extends Timestamps {
  studentId: string;
  student: Student;
  groupId: string | null;
  group: Group | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  forMonth: string;
  note: string | null;
  receivedBy: User | null;
}

export interface GroupBalance {
  groupId: string;
  groupName: string;
  courseName: string;
  monthlyPrice: number;
  months: number;
  charged: number;
  paid: number;
  debt: number;
}

export interface StudentDebt {
  studentId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  parentPhone: string | null;
  totalDebt: number;
  groups: GroupBalance[];
}

export type LeadStatus = 'new' | 'contacted' | 'trial' | 'converted' | 'lost';
export type LeadSource =
  | 'instagram'
  | 'telegram'
  | 'facebook'
  | 'website'
  | 'referral'
  | 'phone_call'
  | 'walk_in'
  | 'other';

export interface Lead extends Timestamps {
  fullName: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  status: LeadStatus;
  courseId: string | null;
  course: Course | null;
  assignedToId: string | null;
  assignedTo: User | null;
  note: string | null;
  nextContactAt: string | null;
  lostReason: string | null;
  convertedStudentId: string | null;
  convertedAt: string | null;
}

export type NotificationType = 'announcement' | 'payment_received' | 'absence' | 'lead_assigned';

export interface AppNotification extends Timestamps {
  userId: string;
  type: NotificationType;
  title: string | null;
  message: string | null;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
}
