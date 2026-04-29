import { useNotificationStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons = { success: CheckCircle, info: Info, warning: AlertTriangle, error: AlertTriangle };

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotificationStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <Card key={n.id} className={cn(!n.read && 'border-primary/20 bg-primary/[0.02]')} onClick={() => markRead(n.id)}>
              <CardContent className="py-3 flex items-start gap-3 cursor-pointer">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  n.type === 'success' && 'bg-success/10 text-success',
                  n.type === 'info' && 'bg-info/10 text-info',
                  n.type === 'warning' && 'bg-warning/10 text-warning',
                  n.type === 'error' && 'bg-destructive/10 text-destructive',
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
