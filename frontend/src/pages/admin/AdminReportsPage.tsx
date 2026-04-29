import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const weeklyData = [
  { day: 'Mon', bookings: 18 }, { day: 'Tue', bookings: 25 }, { day: 'Wed', bookings: 32 },
  { day: 'Thu', bookings: 28 }, { day: 'Fri', bookings: 20 }, { day: 'Sat', bookings: 12 },
];

const statusData = [
  { name: 'Upcoming', value: 45 }, { name: 'Completed', value: 120 }, { name: 'Cancelled', value: 15 },
];
const COLORS = ['hsl(199,89%,48%)', 'hsl(152,55%,42%)', 'hsl(0,72%,55%)'];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="py-6">
            <h2 className="text-sm font-medium mb-4">Weekly Bookings</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <h2 className="text-sm font-medium mb-4">Booking Status Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
