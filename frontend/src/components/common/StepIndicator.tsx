import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors",
                isDone ? "bg-success text-success-foreground" :
                isActive ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {isDone ? '✓' : stepNum}
              </div>
              <span className={cn(
                "text-xs font-medium truncate hidden sm:block",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-1", isDone ? "bg-success" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
