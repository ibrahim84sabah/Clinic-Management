
export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
}

export enum MaterialType {
  SERVICE = 'SERVICE',
  CONSUMABLE = 'CONSUMABLE'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  doctor_id: string;
  appointment_date: string;
  status: AppointmentStatus;
  notes: string;
  created_at: string;
}

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  selling_price?: number;
  cost_price: number;
  stock_quantity: number;
  order_limit: number;
  unit: string;
}

export interface Patient {
  id: string;
  name: string;
  phones: string[];
  address: string;
  age: number;
  medical_history: string[];
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
  read: boolean;
}

export interface SessionRecord {
  id: string;
  patient_id: string;
  service_id: string;
  doctor_id: string;
  doctor_commission_pct: number;
  cost_of_consumables: number;
  selling_price: number;
  net_profit: number;
  date: string;
  notes: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface BeforeAfterPhoto {
  id: string;
  session_id: string;
  type: 'BEFORE' | 'AFTER';
  url: string;
}
