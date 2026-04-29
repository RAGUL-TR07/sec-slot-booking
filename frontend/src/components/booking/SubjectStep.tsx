import { Card, CardContent } from '@/components/ui/card';
import { useBookingFlowStore } from '@/store';
import { BookOpen } from 'lucide-react';
import type { Subject } from '@/types';

export function SubjectStep({ subjects }: { subjects: Subject[] }) {
  const selectSubject = useBookingFlowStore((s) => s.selectSubject);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Select Subject</h2>
      <div className="grid gap-2">
        {subjects.map((sub) => (
          <Card
            key={sub.id}
            className="cursor-pointer hover:shadow-sm hover:border-primary/30 transition-all"
            onClick={() => selectSubject(sub)}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{sub.name}</p>
                <p className="text-xs text-muted-foreground">{sub.code} · {sub.department} · Semester {sub.semester}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
