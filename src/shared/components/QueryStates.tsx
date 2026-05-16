import { AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { ReactNode } from "react";

export const QueryErrorCard = ({
  error,
  onRetry,
  title = "Couldn't load data",
}: {
  error: unknown;
  onRetry: () => void;
  title?: string;
}) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full rounded-lg border border-accent/40 bg-accent-soft p-6 text-center">
        <AlertCircle className="w-6 h-6 text-accent mx-auto mb-2" />
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-1 break-words">{message}</div>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    </div>
  );
};

export const EmptyState = ({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) => (
  <div className="flex items-center justify-center py-12">
    <div className="max-w-md w-full text-center">
      <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-3">
        {icon ?? <Inbox className="w-5 h-5" />}
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  </div>
);

export const InlineErrorBanner = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 px-3 py-2 rounded-md border border-accent/40 bg-accent-soft text-xs text-accent"
    >
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="break-words">{message}</span>
    </div>
  );
};

export const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`bg-secondary/70 rounded animate-pulse ${className}`} />
);

export const SkeletonRows = ({
  rows = 5,
  rowClassName = "h-10",
}: {
  rows?: number;
  rowClassName?: string;
}) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonBlock key={i} className={rowClassName} />
    ))}
  </div>
);