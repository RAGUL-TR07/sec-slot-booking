import { useEffect, useState } from 'react';
import { useBookingFlowStore } from '@/store';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SeatStep() {
  const { selectedSlot, roomId, selectedSeat, selectSeat, setStep } = useBookingFlowStore();
  const [seatMap, setSeatMap] = useState<Record<string, 'available' | 'booked' | 'blocked'>>({});
  const [loading, setLoading] = useState(true);

  const room = selectedSlot?.room;

  useEffect(() => {
    if (roomId) {
      api.getSeatMap(roomId, selectedSlot?.id).then((m) => { setSeatMap(m); setLoading(false); });
    }
  }, [roomId, selectedSlot?.id]);

  if (loading) return <LoadingState message="Loading seat map..." />;
  if (!room) return <p>Room not found.</p>;

  const rows = room.rows;
  const cols = room.columns;
  const totalSeats = rows * cols;
  const available = Object.values(seatMap).filter((s) => s === 'available').length;
  const booked = Object.values(seatMap).filter((s) => s === 'booked').length;

  const handleSelect = (label: string) => {
    if (seatMap[label] !== 'available') return;
    selectSeat(label);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-lg font-medium">Select Your Seat</h2>
      </div>

      <p className="text-sm text-muted-foreground">{room.name} · {room.building} · Floor {room.floor}</p>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-4 w-4 rounded seat-btn seat-available" /> Available ({available})</span>
        <span className="flex items-center gap-1"><span className="h-4 w-4 rounded seat-btn seat-booked" /> Booked ({booked})</span>
        <span className="flex items-center gap-1"><span className="h-4 w-4 rounded seat-btn seat-blocked" /> Blocked</span>
        <span className="flex items-center gap-1"><span className="h-4 w-4 rounded seat-btn seat-selected" /> Selected</span>
      </div>

      {/* Front label */}
      <div className="text-center text-xs text-muted-foreground border-b pb-2 font-medium tracking-widest uppercase">
        Front
      </div>

      {/* Seat Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1.5" style={{ gridTemplateColumns: `auto repeat(${cols}, 1fr)` }}>
          {/* Header row */}
          <div />
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className="text-center text-xs text-muted-foreground font-medium">{c + 1}</div>
          ))}

          {Array.from({ length: rows }, (_, r) => {
            const rowLabel = String.fromCharCode(65 + r);
            return (
              <>
                <div key={`row-${r}`} className="flex items-center justify-center text-xs text-muted-foreground font-medium w-6">
                  {rowLabel}
                </div>
                {Array.from({ length: cols }, (_, c) => {
                  const label = `${rowLabel}${c + 1}`;
                  const status = label === selectedSeat ? 'selected' : (seatMap[label] || 'blocked');
                  return (
                    <button
                      key={label}
                      disabled={status === 'booked' || status === 'blocked'}
                      onClick={() => handleSelect(label)}
                      className={cn('seat-btn', {
                        'seat-available': status === 'available',
                        'seat-booked': status === 'booked',
                        'seat-blocked': status === 'blocked',
                        'seat-selected': status === 'selected',
                      })}
                      title={label}
                    >
                      {c + 1}
                    </button>
                  );
                })}
              </>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {selectedSeat ? `Selected: Seat ${selectedSeat}` : 'Tap a seat to select'}
            </p>
            <p className="text-xs text-muted-foreground">{available} seats available out of {totalSeats}</p>
          </div>
          <Button disabled={!selectedSeat} onClick={() => setStep(4)}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
