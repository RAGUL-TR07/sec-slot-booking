import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Room } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { Plus, Pencil, Trash2, DoorOpen, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: '', building: '', floor: '', rows: '', columns: '' });
  const { toast } = useToast();

  useEffect(() => { api.getRooms().then((r) => { setRooms(r); setLoading(false); }); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', building: '', floor: '', rows: '', columns: '' }); setDialogOpen(true); };
  const openEdit = (r: Room) => { setEditing(r); setForm({ name: r.name, building: r.building, floor: String(r.floor), rows: String(r.rows), columns: String(r.columns) }); setDialogOpen(true); };

  const handleSave = async () => {
    try {
      const numRows = Number(form.rows);
      const numCols = Number(form.columns);
      if (numRows < 1 || numCols < 1 || numRows > 20 || numCols > 20) {
        toast({ title: 'Invalid grid size', description: 'Rows and columns must be between 1 and 20.', variant: 'destructive' });
        return;
      }

      const data = {
        name: form.name,
        building: form.building,
        floor: Number(form.floor),
        rows: numRows,
        columns: numCols,
      };

      if (editing) {
        const updated = await api.updateRoom(editing.id, data);
        setRooms(rooms.map((r) => r.id === updated.id ? updated : r));
        toast({ title: 'Room updated' });
      } else {
        const created = await api.createRoom(data);
        setRooms([...rooms, created]);
        toast({ title: 'Room created' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Operation failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await api.deleteRoom(id);
      setRooms(rooms.filter((r) => r.id !== id));
      toast({ title: 'Room deleted' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (room: Room) => {
    try {
      const updated = await api.updateRoom(room.id, { isActive: !room.isActive });
      setRooms(rooms.map((r) => r.id === updated.id ? updated : r));
    } catch (error: any) {
      toast({ title: 'Toggle failed', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Rooms / Halls</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Room</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rooms.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{r.name}</p>
                  <StatusBadge status={r.isActive ? 'active' : 'inactive'} />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setPreviewRoom(r)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{r.building} · Floor {r.floor} · {r.rows}×{r.columns} ({r.capacity} seats)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Room' : 'Add Room'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Building</Label><Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} /></div>
            <div><Label>Floor</Label><Input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Rows</Label><Input type="number" min={1} max={20} value={form.rows} onChange={(e) => setForm({ ...form, rows: e.target.value })} /></div>
              <div><Label>Columns</Label><Input type="number" min={1} max={20} value={form.columns} onChange={(e) => setForm({ ...form, columns: e.target.value })} /></div>
            </div>
            {form.rows && form.columns && (
              <p className="text-xs text-muted-foreground">Capacity: {Number(form.rows) * Number(form.columns)} seats</p>
            )}
            {/* Live preview */}
            {Number(form.rows) > 0 && Number(form.columns) > 0 && Number(form.rows) <= 20 && Number(form.columns) <= 20 && (
              <div className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Seat Preview</p>
                <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${form.columns}, 1fr)` }}>
                  {Array.from({ length: Number(form.rows) * Number(form.columns) }, (_, i) => {
                    const r = Math.floor(i / Number(form.columns));
                    const c = i % Number(form.columns);
                    return (
                      <div key={i} className="h-6 w-6 rounded text-[9px] bg-muted flex items-center justify-center text-muted-foreground">
                        {String.fromCharCode(65 + r)}{c + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <Button onClick={handleSave} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewRoom} onOpenChange={() => setPreviewRoom(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{previewRoom?.name} — Seat Layout</DialogTitle></DialogHeader>
          {previewRoom && (
            <div className="overflow-x-auto">
              <div className="text-center text-xs text-muted-foreground border-b pb-2 mb-3 font-medium tracking-widest uppercase">Front</div>
              <div className="inline-grid gap-1.5" style={{ gridTemplateColumns: `auto repeat(${previewRoom.columns}, 1fr)` }}>
                <div />
                {Array.from({ length: previewRoom.columns }, (_, c) => (
                  <div key={c} className="text-center text-xs text-muted-foreground">{c + 1}</div>
                ))}
                {Array.from({ length: previewRoom.rows }, (_, r) => (
                  <>
                    <div key={`r${r}`} className="text-xs text-muted-foreground flex items-center justify-center">{String.fromCharCode(65 + r)}</div>
                    {Array.from({ length: previewRoom.columns }, (_, c) => (
                      <div key={`${r}${c}`} className="seat-btn seat-available text-[9px]">{String.fromCharCode(65 + r)}{c + 1}</div>
                    ))}
                  </>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{previewRoom.rows}×{previewRoom.columns} = {previewRoom.capacity} seats</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
