import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBookingFlowStore } from '@/store';
import { Clock, MapPin, ArrowLeft } from 'lucide-react';
import type { TimeSlot } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';

export function SlotStep({ slots }: { slots: TimeSlot[] }) {
  const { selectSlot, selectedSubject, setStep } = useBookingFlowStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-lg font-medium">Select Time Slot</h2>
      </div>
      <p className="text-sm text-muted-foreground">For: {selectedSubject?.name}</p>

      {slots.length === 0 ? (
        <EmptyState icon={Clock} title="No slots available" description="No time slots are available for this subject right now." />
      ) : (
        <div className="grid gap-2">
          {slots.map((slot) => {
            const room = slot.room;
            return (
              <Card key={slot.id} className="cursor-pointer hover:shadow-sm hover:border-primary/30 transition-all" onClick={() => selectSlot(slot)}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{slot.label}</p>
                      <p className="text-xs text-muted-foreground">{slot.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {room?.name || 'TBD'}
                    </p>
                    <p className="text-xs text-muted-foreground">{room?.building}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
