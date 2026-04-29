/**
 * Real API client for SEC Slot Booking Backend (MongoDB/Express)
 * Backend API base: http://localhost:5000/api/v1
 * All responses: { success: bool, message: string, data: {...} }
 */

import type { Subject, TimeSlot, Room, Booking, User } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ─── Token Management ────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// ─── Core HTTP Client ────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  _retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && _retry) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
          return request<T>(path, options, false);
        }
      } catch {
        // refresh failed
      }
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  // Backend wraps everything in { success, message, data }
  return body.data as T;
}

function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

function post<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

function put<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}

// ─── Response shape helpers ───────────────────────────────────────────────────

interface ListResponse<T> {
  items: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

/** Normalise paginated list responses from the backend */
function extractList<T>(data: unknown, key: string): T[] {
  if (!data) return [];
  // Data can be { subjects: [...], meta: {...} } or { bookings: [...] }
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj[key])) return obj[key] as T[];
  // Fallback: if data itself is an array
  if (Array.isArray(data)) return data as T[];
  return [];
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(refNumber: string, password: string): Promise<User> {
    const result = await post<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { refNumber, password },
    );
    setTokens(result.accessToken, result.refreshToken);
    return result.user;
  },

  async logout(): Promise<void> {
    try {
      await post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  async getMe(): Promise<User> {
    const result = await get<{ user: User }>('/auth/me');
    return result.user;
  },

  // ── Subjects ──────────────────────────────────────────────────────────────

  async getSubjects(): Promise<Subject[]> {
    const data = await get<unknown>('/subjects?isActive=true&limit=100');
    return extractList<Subject>(data, 'subjects');
  },

  async getAllSubjects(): Promise<Subject[]> {
    const data = await get<unknown>('/admin/subjects?limit=100');
    return extractList<Subject>(data, 'subjects');
  },

  // ── Slots ─────────────────────────────────────────────────────────────────

  async getSlots(subjectId: string): Promise<TimeSlot[]> {
    const data = await get<unknown>(`/slots?subjectId=${subjectId}&isActive=true&limit=100`);
    const slots = extractList<TimeSlot>(data, 'slots');
    // Add label field expected by frontend components
    return slots.map((s: any) => ({
      ...s,
      date: s.date?.split?.('T')[0] ?? s.date,
      label: `${s.startTime} – ${s.endTime}`,
      roomId: s.roomId?.id ?? s.roomId?._id ?? s.roomId,
      room: typeof s.roomId === 'object' ? s.roomId : undefined,
      subject: typeof s.subjectId === 'object' ? s.subjectId : undefined,
    }));
  },

  async getAllSlots(): Promise<TimeSlot[]> {
    const data = await get<unknown>('/admin/slots?limit=100');
    const slots = extractList<TimeSlot>(data, 'slots');
    return slots.map((s: any) => ({
      ...s,
      date: s.date?.split?.('T')[0] ?? s.date,
      label: `${s.startTime} – ${s.endTime}`,
      roomId: s.roomId?.id ?? s.roomId?._id ?? s.roomId,
      room: typeof s.roomId === 'object' ? s.roomId : undefined,
      subject: typeof s.subjectId === 'object' ? s.subjectId : undefined,
    }));
  },

  // ── Rooms ─────────────────────────────────────────────────────────────────

  async getRooms(): Promise<Room[]> {
    const data = await get<unknown>('/admin/rooms?limit=100');
    return extractList<Room>(data, 'rooms');
  },

  // ── Seat Map ──────────────────────────────────────────────────────────────

  async getSeatMap(
    roomId: string,
    slotId?: string,
  ): Promise<Record<string, 'available' | 'booked' | 'blocked'>> {
    const qs = slotId ? `?slotId=${slotId}` : '';
    const data = await get<unknown>(`/rooms/${roomId}/seat-map${qs}`);
    // Backend returns the map directly as the data value
    return data as Record<string, 'available' | 'booked' | 'blocked'>;
  },

  // ── Bookings ──────────────────────────────────────────────────────────────

  async createBooking(payload: {
    studentId: string;
    subjectId: string;
    slotId: string;
    roomId: string;
    seatLabel: string;
    date: string;
  }): Promise<Booking> {
    const result = await post<{ booking: Booking }>('/bookings', {
      subjectId: payload.subjectId,
      slotId: payload.slotId,
      roomId: payload.roomId,
      seatLabel: payload.seatLabel,
    });
    const b = result.booking;
    return {
      ...b,
      id: b.id ?? (b as any)._id,
      studentId: payload.studentId,
      date: payload.date,
      qrPayload: b.qrPayload ?? '',
    };
  },

  async getBookings(_studentId: string): Promise<Booking[]> {
    const data = await get<unknown>('/bookings/my?limit=100');
    const bookings = extractList<Booking>(data, 'bookings');
    return bookings.map((b: any) => ({
      ...b,
      id: b.id ?? b._id,
      subjectId: b.subjectId?.id ?? b.subjectId?._id ?? b.subjectId,
      slotId: b.slotId?.id ?? b.slotId?._id ?? b.slotId,
      roomId: b.roomId?.id ?? b.roomId?._id ?? b.roomId,
      date: b.slotId?.date ?? b.date,
      qrPayload: b.qrPayload ?? '',
      subject: typeof b.subjectId === 'object' ? b.subjectId : undefined,
      room: typeof b.roomId === 'object' ? b.roomId : undefined,
      slot: typeof b.slotId === 'object' ? b.slotId : undefined,
      student: typeof b.studentId === 'object' ? b.studentId : undefined,
    }));
  },

  async getAllBookings(): Promise<Booking[]> {
    const data = await get<unknown>('/admin/reports/bookings?limit=100');
    const bookings = extractList<Booking>(data, 'bookings');
    return bookings.map((b: any) => ({
      ...b,
      id: b.id ?? b._id,
      subjectId: b.subjectId?.id ?? b.subjectId?._id ?? b.subjectId,
      slotId: b.slotId?.id ?? b.slotId?._id ?? b.slotId,
      roomId: b.roomId?.id ?? b.roomId?._id ?? b.roomId,
      date: b.slotId?.date ?? b.date,
      qrPayload: b.qrPayload ?? '',
      subject: typeof b.subjectId === 'object' ? b.subjectId : undefined,
      room: typeof b.roomId === 'object' ? b.roomId : undefined,
      slot: typeof b.slotId === 'object' ? b.slotId : undefined,
      student: typeof b.studentId === 'object' ? b.studentId : undefined,
    }));
  },

  async cancelBooking(bookingId: string): Promise<void> {
    await del(`/bookings/${bookingId}`);
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  async getAdminStats() {
    return get<unknown>('/admin/stats');
  },

  async createSubject(data: Partial<Subject>): Promise<Subject> {
    const result = await post<{ subject: Subject }>('/admin/subjects', data);
    return result.subject;
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    const result = await put<{ subject: Subject }>(`/admin/subjects/${id}`, data);
    return result.subject;
  },

  async deleteSubject(id: string): Promise<void> {
    await del(`/admin/subjects/${id}`);
  },

  async createRoom(data: Partial<Room>): Promise<Room> {
    const result = await post<{ room: Room }>('/admin/rooms', data);
    return result.room;
  },

  async updateRoom(id: string, data: Partial<Room>): Promise<Room> {
    const result = await put<{ room: Room }>(`/admin/rooms/${id}`, data);
    return result.room;
  },

  async deleteRoom(id: string): Promise<void> {
    await del(`/admin/rooms/${id}`);
  },

  async createSlot(data: Partial<TimeSlot>): Promise<TimeSlot> {
    const result = await post<{ slot: TimeSlot }>('/admin/slots', data);
    return result.slot;
  },

  async updateSlot(id: string, data: Partial<TimeSlot>): Promise<TimeSlot> {
    const result = await put<{ slot: TimeSlot }>(`/admin/slots/${id}`, data);
    return result.slot;
  },

  async deleteSlot(id: string): Promise<void> {
    await del(`/admin/slots/${id}`);
  },

  async validateQr(qrData: string) {
    return post<unknown>('/admin/bookings/validate-qr', { qrData });
  },

  async exportReport(format: 'csv' | 'json' = 'csv'): Promise<void> {
    const token = getAccessToken();
    const res = await fetch(`${BASE_URL}/admin/reports/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-report.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
