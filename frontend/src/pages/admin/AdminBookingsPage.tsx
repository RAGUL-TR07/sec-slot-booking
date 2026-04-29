import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Booking } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { Search, User, Clock, MapPin } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { api.getAllBookings().then((b) => { setBookings(b); setLoading(false); }); }, []);

  const filtered = bookings.filter((b) => {
    const student = b.student || { name: 'Unknown' };
    return b.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
      (student?.name || '').toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Booking Monitor</h1>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by ref or student..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="space-y-2">
        {filtered.map((b) => {
          const student = b.student;
          const subject = b.subject;
          const room = b.room;
          const slot = b.slot;
          return (
            <Card key={b.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{b.bookingRef}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> {student?.name} ({student?.refNumber})</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {slot?.label || `${slot?.startTime} - ${slot?.endTime}`} · {b.date}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {subject?.name} · {room?.name} · Seat {b.seatLabel}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
