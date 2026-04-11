/**
 * SkipGate — Dev-only "skip to next step" helper.
 *
 * Event Mode flow'unda her ekranın altına eklenir. `import.meta.env.DEV`
 * check ile sadece development build'de render edilir.
 *
 * Production'da hiç bundle'a girmez (Vite dead-code elimination).
 */
import type { MouseEvent } from "react";
import { cn } from "../../lib/cn";

export interface SkipGateProps {
  label?: string;
  onSkip: () => void;
  className?: string;
}

export function SkipGate({ label = "[dev] skip →", onSkip, className }: SkipGateProps) {
  if (!import.meta.env.DEV) return null;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onSkip();
  };

  return (
    <div
      className={cn(
        "mt-6 pt-4 border-t border-arena-text-muted/20 flex justify-center",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        className="font-mono text-[9px] text-arena-text-tertiary/60 hover:text-arena-text-secondary transition-colors"
      >
        {label}
      </button>
    </div>
  );
}

SkipGate.displayName = "SkipGate";
