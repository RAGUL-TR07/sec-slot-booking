import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useBookingStore } from '@/store';
import { api } from '@/services/api';
import { Subject } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { CalendarDays, BookOpen, ArrowRight, Clock } from 'lucide-react';

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const { bookings, setBookings } = useBookingStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.getBookings(user.id),
        api.getSubjects()
      ]).then(([b, s]) => {
        setBookings(b);
        setSubjects(s.filter(subj => subj.isActive));
        setLoading(false);
      }).catch(console.error);
    }
  }, [user, setBookings]);

  const upcoming = bookings.filter((b) => b.status === 'upcoming');

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground mt-1">Book your exam seat in a few simple steps.</p>
      </div>

      {/* Quick Action */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">Book a Seat</p>
              <p className="text-sm text-muted-foreground">Select subject, slot, and seat</p>
            </div>
          </div>
          <Button onClick={() => navigate('/book')}>
            Book Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-medium text-foreground mb-3">Upcoming Bookings</h2>
        {upcoming.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No upcoming bookings.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => {
              const subject = subjects.find((s) => s.id === b.subjectId);
              return (
                <Card key={b.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{subject?.name || b.subjectId}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {b.date} · Seat {b.seatLabel}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Subjects */}
      <div>
        <h2 className="text-lg font-medium text-foreground mb-3">Available Subjects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {subjects.slice(0, 4).map((s) => (
            <Card key={s.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate('/book')}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                  {s.code.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.code} · Sem {s.semester}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
