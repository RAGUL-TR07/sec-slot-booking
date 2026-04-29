import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Hash, Building, GraduationCap } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const fields = [
    { icon: User, label: 'Name', value: user?.name },
    { icon: Hash, label: 'Reference No.', value: user?.refNumber },
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Building, label: 'Department', value: user?.department },
    { icon: GraduationCap, label: 'Year', value: user?.year || 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-lg">{user?.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Student'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <f.icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-medium">{f.value}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
