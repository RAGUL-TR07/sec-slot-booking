import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store";
import { AppLayout } from "@/components/layout/AppLayout";

import LoginPage from "@/pages/auth/LoginPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import BookingPage from "@/pages/student/BookingPage";
import MyBookingsPage from "@/pages/student/MyBookingsPage";
import BookingHistoryPage from "@/pages/student/BookingHistoryPage";
import ProfilePage from "@/pages/student/ProfilePage";
import NotificationsPage from "@/pages/student/NotificationsPage";
import FAQPage from "@/pages/student/FAQPage";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSubjectsPage from "@/pages/admin/AdminSubjectsPage";
import AdminSlotsPage from "@/pages/admin/AdminSlotsPage";
import AdminRoomsPage from "@/pages/admin/AdminRoomsPage";
import AdminBookingsPage from "@/pages/admin/AdminBookingsPage";
import AdminScannerPage from "@/pages/admin/AdminScannerPage";
import AdminReportsPage from "@/pages/admin/AdminReportsPage";
import AdminNotificationsPage from "@/pages/admin/AdminNotificationsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'student' | 'admin' }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student Routes */}
          <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/book" element={<ProtectedRoute role="student"><BookingPage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute role="student"><MyBookingsPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute role="student"><BookingHistoryPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute role="admin"><AdminSubjectsPage /></ProtectedRoute>} />
          <Route path="/admin/slots" element={<ProtectedRoute role="admin"><AdminSlotsPage /></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute role="admin"><AdminRoomsPage /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute role="admin"><AdminBookingsPage /></ProtectedRoute>} />
          <Route path="/admin/scanner" element={<ProtectedRoute role="admin"><AdminScannerPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReportsPage /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><AdminNotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettingsPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
