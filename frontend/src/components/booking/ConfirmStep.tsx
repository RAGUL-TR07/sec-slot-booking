import { useState } from 'react';
import { useAuthStore, useBookingFlowStore, useBookingStore } from '@/store';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

export function ConfirmStep({ onDone }: { onDone: () => void }) {
  const { selectedSubject, selectedSlot, selectedSeat, roomId, setStep, reset } = useBookingFlowStore();
  const { addBooking } = useBookingStore();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const { toast } = useToast();

  const room = selectedSlot?.room;

  const handleConfirm = async () => {
    if (!user || !selectedSubject || !selectedSlot || !selectedSeat || !roomId) return;
    setLoading(true);
    try {
      const booking = await api.createBooking({
        studentId: user.id,
        subjectId: selectedSubject.id,
        slotId: selectedSlot.id,
        roomId,
        seatLabel: selectedSeat,
        date: selectedSlot.date,
      });
      booking.qrPayload = JSON.stringify({
        ref: booking.bookingRef,
        student: user.name,
        refNumber: user.refNumber,
        subject: selectedSubject.name,
        room: room?.name,
        seat: selectedSeat,
        date: selectedSlot.date,
        time: selectedSlot.label,
        createdAt: booking.createdAt,
        expiry: selectedSlot.date + 'T' + selectedSlot.endTime,
        status: booking.status,
      });
      addBooking(booking);
      setBookingRef(booking.bookingRef);
      setConfirmed(true);
      toast({ title: 'Booking confirmed!', description: `Seat ${selectedSeat} reserved.` });
    } catch {
      toast({ title: 'Booking failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    const qrData = JSON.stringify({
      ref: bookingRef,
      student: user?.name,
      refNumber: user?.refNumber,
      subject: selectedSubject?.name,
      room: room?.name,
      seat: selectedSeat,
      date: selectedSlot?.date,
      time: selectedSlot?.label,
    });

    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-success" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground mt-1">Ref: {bookingRef}</p>
        </div>
        <Card className="w-full max-w-sm">
          <CardContent className="py-6 flex flex-col items-center gap-4">
            <QRCodeSVG value={qrData} size={180} />
            <p className="text-xs text-muted-foreground text-center">Show this QR code at the exam hall entrance.</p>
          </CardContent>
        </Card>
        <div className="text-sm space-y-1 text-center">
          <p><span className="text-muted-foreground">Subject:</span> {selectedSubject?.name}</p>
          <p><span className="text-muted-foreground">Slot:</span> {selectedSlot?.label} · {selectedSlot?.date}</p>
          <p><span className="text-muted-foreground">Room:</span> {room?.name} · Seat {selectedSeat}</p>
        </div>
        <Button onClick={onDone}>View My Bookings</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-lg font-medium">Confirm Booking</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Subject</p><p className="font-medium">{selectedSubject?.name}</p></div>
            <div><p className="text-muted-foreground text-xs">Code</p><p className="font-medium">{selectedSubject?.code}</p></div>
            <div><p className="text-muted-foreground text-xs">Date</p><p className="font-medium">{selectedSlot?.date}</p></div>
            <div><p className="text-muted-foreground text-xs">Time</p><p className="font-medium">{selectedSlot?.label}</p></div>
            <div><p className="text-muted-foreground text-xs">Room</p><p className="font-medium">{room?.name}</p></div>
            <div><p className="text-muted-foreground text-xs">Seat</p><p className="font-medium text-primary text-lg">{selectedSeat}</p></div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleConfirm} className="w-full" disabled={loading} size="lg">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...</> : 'Confirm Booking'}
      </Button>
    </div>
  );
}
