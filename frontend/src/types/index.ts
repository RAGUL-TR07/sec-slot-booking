export interface User {
  id: string;
  name: string;
  refNumber: string;
  email: string;
  role: 'student' | 'admin';
  department: string;
  year?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  date: string;
  subjectId: string;
  roomId: string;
  isActive: boolean;
  subject?: any;
  room?: any;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  rows: number;
  columns: number;
  capacity: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  bookingRef: string;
  studentId: string;
  subjectId: string;
  slotId: string;
  roomId: string;
  seatLabel: string;
  date: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
  qrPayload: string;

  subject?: any;
  room?: any;
  slot?: any;
  student?: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export type SeatStatus = 'available' | 'booked' | 'blocked' | 'selected';
