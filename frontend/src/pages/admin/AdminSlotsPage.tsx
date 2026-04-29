import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { TimeSlot, Subject, Room } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimeSlot | null>(null);
  const [form, setForm] = useState({ startTime: '', endTime: '', date: '', subjectId: '', roomId: '' });
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    Promise.all([api.getAllSlots(), api.getAllSubjects(), api.getRooms()]).then(([s, subjs, r]) => {
      setSlots(s);
      setSubjects(subjs);
      setRooms(r);
      setLoading(false);
    });
  }, []);

  const openCreate = () => { setEditing(null); setForm({ startTime: '', endTime: '', date: '', subjectId: '', roomId: '' }); setDialogOpen(true); };
  const openEdit = (s: TimeSlot) => { setEditing(s); setForm({ startTime: s.startTime, endTime: s.endTime, date: s.date, subjectId: s.subjectId, roomId: s.roomId }); setDialogOpen(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        const updated = await api.updateSlot(editing.id, form);
        setSlots(slots.map((s) => s.id === updated.id ? updated : s));
        toast({ title: 'Slot updated' });
      } else {
        const created = await api.createSlot(form);
        setSlots([...slots, created]);
        toast({ title: 'Slot created' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Operation failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    try {
      await api.deleteSlot(id);
      setSlots(slots.filter((s) => s.id !== id));
      toast({ title: 'Slot deleted' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (slot: TimeSlot) => {
    try {
      const updated = await api.updateSlot(slot.id, { isActive: !slot.isActive });
      setSlots(slots.map((s) => s.id === updated.id ? updated : s));
    } catch (error: any) {
      toast({ title: 'Toggle failed', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Time Slots</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Slot</Button>
      </div>

      <div className="space-y-2">
        {slots.map((s) => {
          const subject = subjects.find((x) => x.id === s.subjectId);
          const room = rooms.find((x) => x.id === s.roomId);
          return (
            <Card key={s.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{s.label} <StatusBadge status={s.isActive ? 'active' : 'inactive'} /></p>
                    <p className="text-xs text-muted-foreground">{s.date} · {subject?.name} · {room?.name}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(s)}>{s.isActive ? 'Disable' : 'Enable'}</Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Slot' : 'Add Slot'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div><Label>End Time</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Room</Label>
              <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v })}>
                <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
