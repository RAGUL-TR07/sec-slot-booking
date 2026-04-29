import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '@/services/socket';

export const useSocketEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = socketService.connect();

    // Listen for slot updates (admin creates/updates/deletes slot, or seat is booked)
    socket.on('slot_updated', (data) => {
      console.log('Socket event: slot_updated', data);
      // Invalidate slots query so UI automatically refreshes available slots and seats
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['seatMap'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    });

    // Listen for new bookings
    socket.on('booking_created', (data) => {
      console.log('Socket event: booking_created', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['seatMap'] });
    });

    // Listen for cancelled bookings
    socket.on('booking_cancelled', (data) => {
      console.log('Socket event: booking_cancelled', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['allBookings'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['seatMap'] });
    });

    return () => {
      socket.off('slot_updated');
      socket.off('booking_created');
      socket.off('booking_cancelled');
      // Do not fully disconnect here if we want the connection alive globally,
      // but typically we manage connection lifecycle in a root layout.
    };
  }, [queryClient]);
};
