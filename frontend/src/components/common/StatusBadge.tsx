import { cn } from '@/lib/utils';

type StatusType = 'upcoming' | 'completed' | 'cancelled' | 'active' | 'inactive';

const statusStyles: Record<StatusType, string> = {
  upcoming: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted text-muted-foreground',
};

export function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusStyles[status] || statusStyles.inactive)}>
      {status}
    </span>
  );
}
