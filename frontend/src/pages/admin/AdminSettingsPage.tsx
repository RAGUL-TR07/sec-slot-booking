import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    collegeName: 'SEC College',
    allowCancellation: true,
    bookingCutoffHours: 2,
    maxSeatsPerStudent: 1,
  });

  const handleSave = () => { toast({ title: 'Settings saved' }); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="max-w-lg">
        <CardHeader><CardTitle className="text-base">General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>College Name</Label><Input value={settings.collegeName} onChange={(e) => setSettings({ ...settings, collegeName: e.target.value })} /></div>
          <div><Label>Booking Cutoff (hours before slot)</Label><Input type="number" value={settings.bookingCutoffHours} onChange={(e) => setSettings({ ...settings, bookingCutoffHours: Number(e.target.value) })} /></div>
          <div><Label>Max Seats Per Student</Label><Input type="number" value={settings.maxSeatsPerStudent} onChange={(e) => setSettings({ ...settings, maxSeatsPerStudent: Number(e.target.value) })} /></div>
          <div className="flex items-center justify-between">
            <Label>Allow Booking Cancellation</Label>
            <Switch checked={settings.allowCancellation} onCheckedChange={(v) => setSettings({ ...settings, allowCancellation: v })} />
          </div>
          <Button onClick={handleSave} className="w-full">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
