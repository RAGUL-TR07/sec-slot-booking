import { useEffect, useState } from 'react';
import { useAuthStore, useBookingStore } from '@/store';
import { api } from '@/services/api';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { BookOpen, Clock, MapPin, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';

export default function MyBookingsPage() {
  const user = useAuthStore((s) => s.user);
  const { bookings, setBookings } = useBookingStore();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      api.getBookings(user.id).then((b) => { setBookings(b); setLoading(false); });
    }
  }, [user, setBookings]);

  const handleCancel = async (id: string) => {
    await api.cancelBooking(id);
    setBookings(bookings.map((b) => b.id === id ? { ...b, status: 'cancelled' as const } : b));
    toast({ title: 'Booking cancelled' });
  };

  if (loading) return <LoadingState />;

  const upcoming = bookings.filter((b) => b.status === 'upcoming');
  const past = bookings.filter((b) => b.status !== 'upcoming');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Bookings</h1>

      {bookings.length === 0 ? (
        <EmptyState icon={BookOpen} title="No bookings yet" description="Book your first exam seat to get started." />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming</h2>
              {upcoming.map((b) => <BookingCard key={b.id} booking={b} onCancel={handleCancel} user={user} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Past</h2>
              {past.map((b) => <BookingCard key={b.id} booking={b} user={user} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({ booking: b, onCancel, user }: { booking: any; onCancel?: (id: string) => void; user: any }) {
  const subject = b.subject;
  const room = b.room;
  const slot = b.slot;

  const qrData = JSON.stringify({
    ref: b.bookingRef, student: user?.name, subject: subject?.name,
    room: room?.name, seat: b.seatLabel, date: b.date, time: slot?.label || `${slot?.startTime} - ${slot?.endTime}`,
  });

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{subject?.name}</p>
              <StatusBadge status={b.status} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {slot?.label || `${slot?.startTime} - ${slot?.endTime}` || 'N/A'} · {b.date}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {room?.name} · Seat {b.seatLabel}
            </p>
            <p className="text-xs text-muted-foreground">Ref: {b.bookingRef}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">QR Code</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader><DialogTitle>Booking QR Code</DialogTitle></DialogHeader>
                <div className="flex flex-col items-center gap-3 py-4">
                  <QRCodeSVG value={qrData} size={200} />
                  <p className="text-xs text-muted-foreground">Ref: {b.bookingRef}</p>
                </div>
              </DialogContent>
            </Dialog>
            {b.status === 'upcoming' && onCancel && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onCancel(b.id)}>
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
