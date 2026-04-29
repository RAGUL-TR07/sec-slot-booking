import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingFlowStore } from '@/store';
import { api } from '@/services/api';
import { StepIndicator } from '@/components/common/StepIndicator';
import { LoadingState } from '@/components/common/LoadingState';
import { SubjectStep } from '@/components/booking/SubjectStep';
import { SlotStep } from '@/components/booking/SlotStep';
import { SeatStep } from '@/components/booking/SeatStep';
import { ConfirmStep } from '@/components/booking/ConfirmStep';
import type { Subject, TimeSlot } from '@/types';

const STEPS = ['Subject', 'Slot', 'Seat', 'Confirm'];

export default function BookingPage() {
  const { step, selectedSubject, selectedSlot, reset } = useBookingFlowStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    reset();
    api.getSubjects().then((s) => { setSubjects(s); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      setLoading(true);
      api.getSlots(selectedSubject.id).then((s) => { setSlots(s); setLoading(false); });
    }
  }, [selectedSubject]);

  if (loading && step === 1) return <LoadingState message="Loading subjects..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Book a Seat</h1>
        <p className="text-sm text-muted-foreground mt-1">Follow the steps below to reserve your exam seat.</p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {step === 1 && <SubjectStep subjects={subjects} />}
      {step === 2 && loading ? <LoadingState message="Loading slots..." /> : step === 2 && <SlotStep slots={slots} />}
      {step === 3 && <SeatStep />}
      {step === 4 && <ConfirmStep onDone={() => { reset(); navigate('/bookings'); }} />}
    </div>
  );
}
