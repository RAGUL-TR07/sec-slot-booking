import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { BookOpen, Clock, DoorOpen, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { day: 'Mon', bookings: 18 }, { day: 'Tue', bookings: 25 }, { day: 'Wed', bookings: 32 },
  { day: 'Thu', bookings: 28 }, { day: 'Fri', bookings: 20 }, { day: 'Sat', bookings: 12 },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ subjects: 0, slots: 0, rooms: 0, bookings: 0 });

  useEffect(() => {
    Promise.all([api.getAllSubjects(), api.getAllSlots(), api.getRooms(), api.getAllBookings()]).then(
      ([subjects, slots, rooms, bookings]) => {
        setStats({ subjects: subjects.length, slots: slots.length, rooms: rooms.length, bookings: bookings.length });
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <LoadingState />;

  const statCards = [
    { label: 'Subjects', value: stats.subjects, icon: BookOpen, color: 'text-primary' },
    { label: 'Time Slots', value: stats.slots, icon: Clock, color: 'text-accent' },
    { label: 'Rooms', value: stats.rooms, icon: DoorOpen, color: 'text-warning' },
    { label: 'Bookings', value: stats.bookings, icon: Users, color: 'text-info' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-6">
          <h2 className="text-sm font-medium mb-4">Bookings This Week</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
