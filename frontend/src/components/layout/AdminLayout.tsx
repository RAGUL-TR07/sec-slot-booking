import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import {
  LayoutDashboard, BookOpen, Clock, DoorOpen, BarChart3, QrCode,
  Settings, Bell, LogOut, ChevronRight, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopNavbar } from './TopNavbar';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
  { label: 'Time Slots', path: '/admin/slots', icon: Clock },
  { label: 'Rooms / Halls', path: '/admin/rooms', icon: DoorOpen },
  { label: 'Bookings', path: '/admin/bookings', icon: Users },
  { label: 'QR Scanner', path: '/admin/scanner', icon: QrCode },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => { logout(); navigate('/login'); };

  const adminBadge = (
    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
      Admin
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        homeLink="/admin"
        badge={adminBadge}
      />

      <div className="flex flex-1">
        <aside className={cn(
          "fixed inset-y-14 left-0 z-20 w-60 bg-card border-r transform transition-transform lg:relative lg:inset-auto lg:translate-x-0 lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <nav className="flex flex-col py-3 h-full">
            <div className="flex-1 space-y-0.5 px-2">
              {navItems.map((item) => {
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {active && <ChevronRight className="h-3 w-3 ml-auto" />}
                  </Link>
                );
              })}
            </div>
            <div className="px-2 pt-2 border-t mx-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </nav>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-foreground/20 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
