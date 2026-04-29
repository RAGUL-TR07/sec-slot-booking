import { useEffect, useState } from 'react';
import { useAuthStore, useBookingStore } from '@/store';
import { api } from '@/services/api';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { Card, CardContent } from '@/components/ui/card';
import { History, Clock, MapPin } from 'lucide-react';

export default function BookingHistoryPage() {
  const user = useAuthStore((s) => s.user);
  const { bookings, setBookings } = useBookingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getBookings(user.id).then((b) => { setBookings(b); setLoading(false); });
    }
  }, [user, setBookings]);

  if (loading) return <LoadingState />;

  const past = bookings.filter((b) => b.status !== 'upcoming');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Booking History</h1>
      {past.length === 0 ? (
        <EmptyState icon={History} title="No past bookings" description="Your completed and cancelled bookings will appear here." />
      ) : (
        <div className="space-y-2">
          {past.map((b) => {
            const subject = b.subject;
            const room = b.room;
            const slot = b.slot;
            return (
              <Card key={b.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{subject?.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {slot?.label || `${slot?.startTime} - ${slot?.endTime}`} · {b.date}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {room?.name} · Seat {b.seatLabel}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
