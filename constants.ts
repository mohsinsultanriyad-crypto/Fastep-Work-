
import { User } from './types';

export const APP_NAME = "FASTEP WORK";
export const SHIFT_DURATION_MS = 10 * 60 * 60 * 1000; // 10 hours
export const OT_DECISION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_OT_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours
export const BASE_HOURS = 10;
export const DAYS_IN_MONTH = 30;

export const LEAVE_REASONS = [
  "Sick",
  "Emergency",
  "Family Problem",
  "Passport / Iqama Work",
  "Camp Issue",
  "Other"
];

export const MOCK_WORKERS: User[] = [
  {
    id: 'w1',
    workerId: 'FS1001',
    name: 'Ahmed Hassan',
    role: 'worker',
    trade: 'Mason',
    monthlySalary: 3000,
    phone: '+966 50 123 4567',
    photoUrl: 'https://picsum.photos/seed/w1/200',
    password: 'password123',
    isActive: true
  },
  {
    id: 'w2',
    workerId: 'FS1002',
    name: 'Raj Kumar',
    role: 'worker',
    trade: 'Carpenter',
    monthlySalary: 2800,
    phone: '+966 50 765 4321',
    photoUrl: 'https://picsum.photos/seed/w2/200',
    password: 'password123',
    isActive: true
  }
];

export const MOCK_ADMIN: User = {
  id: 'a1',
  email: 'FSA101',
  name: 'Admin Manager',
  role: 'admin',
  monthlySalary: 0,
  phone: '+966 50 000 0000',
  photoUrl: 'https://picsum.photos/seed/admin/200',
  password: 'password123',
  isActive: true
};
