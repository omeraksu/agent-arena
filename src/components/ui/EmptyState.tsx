/**
 * EmptyState — Reusable "nothing here yet" placeholder.
 *
 * 3 context için kullanılır: quest / collection / activity.
 * Figma'da eksik (gap 3); ARIA tasarım ihtiyaçları listesinde.
 */
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3",
        "py-8 px-6 rounded-md border border-dashed border-arena-text-muted/30",
        "bg-arena-bg-surface/50",
        className,
      )}
    >
      {icon && (
        <div className="text-arena-text-tertiary text-3xl" aria-hidden>
          {icon}
        </div>
      )}
      <h3 className="font-mono text-[11px] uppercase tracking-wider text-arena-text-secondary">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-arena-text-tertiary leading-relaxed max-w-[280px]">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

EmptyState.displayName = "EmptyState";
