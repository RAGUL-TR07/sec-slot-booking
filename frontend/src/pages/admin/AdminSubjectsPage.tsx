import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Subject } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState } from '@/components/common/LoadingState';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ code: '', name: '', department: '', semester: '' });
  const { toast } = useToast();

  useEffect(() => {
    api.getAllSubjects().then((s) => { setSubjects(s); setLoading(false); });
  }, []);

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ code: '', name: '', department: '', semester: '' }); setDialogOpen(true); };
  const openEdit = (s: Subject) => { setEditing(s); setForm({ code: s.code, name: s.name, department: s.department, semester: String(s.semester) }); setDialogOpen(true); };

  const handleSave = async () => {
    try {
      const data = { ...form, semester: Number(form.semester) };
      if (editing) {
        const updated = await api.updateSubject(editing.id, data);
        setSubjects(subjects.map((s) => s.id === updated.id ? updated : s));
        toast({ title: 'Subject updated' });
      } else {
        const created = await api.createSubject(data);
        setSubjects([...subjects, created]);
        toast({ title: 'Subject created' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Operation failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.deleteSubject(id);
      setSubjects(subjects.filter((s) => s.id !== id));
      toast({ title: 'Subject deleted' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (s: Subject) => {
    try {
      const updated = await api.updateSubject(s.id, { isActive: !s.isActive });
      setSubjects(subjects.map((item) => item.id === updated.id ? updated : item));
    } catch (error: any) {
      toast({ title: 'Toggle failed', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Subjects</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Subject</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search subjects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-2">
        {filtered.map((s) => (
          <Card key={s.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{s.name}</p>
                  <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                </div>
                <p className="text-xs text-muted-foreground">{s.code} · {s.department} · Sem {s.semester}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => toggleActive(s)}>
                  {s.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label>Semester</Label><Input type="number" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
