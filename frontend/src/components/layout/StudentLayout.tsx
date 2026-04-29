import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '@/store';
import {
  LayoutDashboard, BookOpen, CalendarDays, History, User, Bell, HelpCircle,
  LogOut, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TopNavbar } from './TopNavbar';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Book Seat', path: '/book', icon: CalendarDays },
  { label: 'My Bookings', path: '/bookings', icon: BookOpen },
  { label: 'History', path: '/history', icon: History },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Help / FAQ', path: '/faq', icon: HelpCircle },
];

export function StudentLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const handleLogout = () => { logout(); navigate('/login'); };

  const bellIcon = (
    <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
          {unreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        homeLink="/dashboard"
        rightExtra={bellIcon}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-14 left-0 z-20 w-60 bg-card border-r transform transition-transform lg:relative lg:inset-auto lg:translate-x-0 lg:z-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <nav className="flex flex-col py-3 h-full">
            <div className="flex-1 space-y-0.5 px-2">
              {navItems.map((item) => {
                const active = pathname === item.path || pathname.startsWith(item.path + '/');
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
                    {item.label === 'Notifications' && unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">{unreadCount}</Badge>
                    )}
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

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-foreground/20 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
