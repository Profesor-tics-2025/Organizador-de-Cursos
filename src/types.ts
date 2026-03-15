export type Modality = 'presencial' | 'teleformación' | 'híbrido';
export type CourseStatus = 'pendiente' | 'confirmado' | 'finalizado';
export type SessionStatus = 'pendiente' | 'impartida';
export type PricingType = 'hourly' | 'total';

export interface Course {
  id?: string;
  name: string;
  entity: string;
  modality: Modality;
  location: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  schedule: string;
  pricingType: PricingType;
  price: number;
  status: CourseStatus;
  color?: string;
  userId: string;
  createdAt: string;
}

export interface Session {
  id?: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  content: string;
  status: SessionStatus;
  userId: string;
}

export interface TeacherSettings {
  userId: string;
  maxHoursPerWeek: number;
  availableDays: string[];
  minHourlyRate: number;
  preferredModality: Modality | 'any';
}

export interface DashboardStats {
  upcomingCourses: number;
  hoursThisWeek: number;
  hoursThisMonth: number;
  incomeThisMonth: number;
  incomeThisYear: number;
  activeCourses: number;
  overlaps: number;
}

export interface Client {
  id?: string;
  name: string;
  cif: string;
  address: string;
  phone: string;
  email: string;
  userId: string;
}
