import { ReactNode } from 'react';
import { useAuthStore } from '@/store';
import { StudentLayout } from './StudentLayout';
import { AdminLayout } from './AdminLayout';
import { useSocketEvents } from '@/hooks/useSocketEvents';

export function AppLayout({ children }: { children: ReactNode }) {
  useSocketEvents();
  const user = useAuthStore((s) => s.user);
  if (!user) return <>{children}</>;
  if (user.role === 'admin') return <AdminLayout>{children}</AdminLayout>;
  return <StudentLayout>{children}</StudentLayout>;
}
