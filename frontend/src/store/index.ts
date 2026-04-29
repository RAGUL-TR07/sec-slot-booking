import { create } from 'zustand';
import type { User, Subject, TimeSlot, Booking, Notification } from '@/types';

// Re-hydrate user from localStorage on page refresh
function loadUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: loadUserFromStorage(),
  isAuthenticated: !!loadUserFromStorage(),
  login: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));

interface BookingFlowStore {
  step: number;
  selectedSubject: Subject | null;
  selectedSlot: TimeSlot | null;
  selectedSeat: string | null;
  roomId: string | null;
  setStep: (s: number) => void;
  selectSubject: (s: Subject) => void;
  selectSlot: (s: TimeSlot) => void;
  selectSeat: (seat: string) => void;
  setRoomId: (id: string) => void;
  reset: () => void;
}

export const useBookingFlowStore = create<BookingFlowStore>((set) => ({
  step: 1,
  selectedSubject: null,
  selectedSlot: null,
  selectedSeat: null,
  roomId: null,
  setStep: (step) => set({ step }),
  selectSubject: (s) => set({ selectedSubject: s, step: 2, selectedSlot: null, selectedSeat: null }),
  selectSlot: (s) => set({ selectedSlot: s, step: 3, selectedSeat: null, roomId: s.roomId }),
  selectSeat: (seat) => set({ selectedSeat: seat, step: 4 }),
  setRoomId: (roomId) => set({ roomId }),
  reset: () => set({ step: 1, selectedSubject: null, selectedSlot: null, selectedSeat: null, roomId: null }),
}));

interface BookingStore {
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
  addBooking: (b: Booking) => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  setBookings: (bookings) => set({ bookings }),
  addBooking: (b) => set((state) => ({ bookings: [b, ...state.bookings] })),
}));

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  markRead: (id) => set((state) => {
    const notifications = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return { notifications, unreadCount: notifications.filter(n => !n.read).length };
  }),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
}));
