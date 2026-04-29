import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { LogOut, User, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  homeLink: string;
  badge?: React.ReactNode;
  rightExtra?: React.ReactNode;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TopNavbar({ sidebarOpen, onToggleSidebar, homeLink, badge, rightExtra }: TopNavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const initials = user ? getInitials(user.name) : '?';

  return (
    <header className="h-14 border-b bg-card flex items-center px-4 gap-3 sticky top-0 z-30 shadow-sm">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Logo + title */}
      <Link
        to={homeLink}
        className="flex items-center gap-2 font-semibold text-primary text-lg tracking-tight select-none"
      >
        <img src="/logo.jpeg" alt="SEC Logo" className="h-6 w-auto object-contain" />
        <span>Slot Booking</span>
      </Link>

      {/* Optional badge (e.g., Admin pill) */}
      {badge}

      <div className="flex-1" />

      {/* Right side extras (e.g., bell icon) */}
      {rightExtra}

      {/* User avatar + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full pl-2 pr-1 py-1 hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          {/* Name — hidden on very small screens */}
          <span className="text-sm font-medium text-foreground hidden sm:block max-w-[140px] truncate">
            {user?.name}
          </span>
          {/* Circular avatar */}
          <span
            className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all flex-shrink-0"
            aria-hidden
          >
            {initials}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            role="menu"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b bg-muted/40">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {user?.refNumber} · {user?.role}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                role="menuitem"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
