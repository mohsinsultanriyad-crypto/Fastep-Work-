
export type Role = 'worker' | 'admin';

export interface User {
  id: string;
  workerId?: string;
  email?: string;
  name: string;
  role: Role;
  trade?: string;
  monthlySalary: number;
  phone: string;
  photoUrl: string;
  password?: string;
  isActive: boolean;
  iqamaExpiry?: string;
  passportExpiry?: string;
}

export type ShiftStatus = 'none' | 'pending' | 'completed';

export interface Shift {
  id: string;
  workerId: string;
  date: string; // ISO string YYYY-MM-DD
  startTime: number; // timestamp
  endTime: number; // timestamp
  status: ShiftStatus;
  breakMinutes: number;
  notes?: string;
  isApproved: boolean;
  totalHours: number;
  estimatedEarnings: number;
  approvedEarnings: number;
  advanceTaken?: number;
}

export interface Leave {
  id: string;
  workerId: string;
  date: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface AdvanceRequest {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled';
  paymentDate?: string;
}

export interface SitePost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
}

export interface Announcement {
  id: string;
  content: string;
  priority: 'low' | 'high';
  timestamp: number;
}
