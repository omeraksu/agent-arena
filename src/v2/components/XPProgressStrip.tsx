/**
 * XPProgressStrip — Thin gradient progress bar for level XP.
 *
 * Figma: MemberHub/Home header, "247 / 300 XP" + teal-purple bar.
 * Gap item 1 (tasarım ihtiyaçları listesi).
 * h-1.5 thin variant, teal → purple gradient fill.
 */
import { cn } from "../../lib/cn";

export interface XPProgressStripProps {
  current: number;
  total: number;
  className?: string;
}

export function XPProgressStrip({ current, total, className }: XPProgressStripProps) {
  const ratio = Math.min(1, Math.max(0, total > 0 ? current / total : 0));

  return (
    <div className={cn("w-full", className)}>
      <div className="h-1.5 w-full rounded-full bg-arena-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-arena-teal to-arena-purple transition-[width] duration-500 ease-out"
          style={{ width: `${ratio * 100}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}

XPProgressStrip.displayName = "XPProgressStrip";
