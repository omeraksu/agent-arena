/**
 * ChipPill — Small rounded pill with optional leading dot.
 *
 * Figma: "[teal dot] Explorer", "[amber dot] Builder Night", "[purple dot] Hack'n Chill"
 * Kullanım: Level title badge, event tag, status pill.
 *
 * Variantlar accent token'larına bağlı. Dot opsiyonel.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export type ChipColor = "teal" | "blue" | "purple" | "pink" | "amber" | "red";

export interface ChipPillProps extends HTMLAttributes<HTMLSpanElement> {
  color?: ChipColor;
  dot?: boolean;
  children: ReactNode;
}

const COLOR_CLASSES: Record<ChipColor, string> = {
  teal:   "bg-arena-teal/15   text-arena-teal   border-arena-teal/40",
  blue:   "bg-arena-blue/15   text-arena-blue   border-arena-blue/40",
  purple: "bg-arena-purple/15 text-arena-purple border-arena-purple/40",
  pink:   "bg-arena-red/15    text-arena-red    border-arena-red/40",
  amber:  "bg-arena-amber/15  text-arena-amber  border-arena-amber/40",
  red:    "bg-arena-red/15    text-arena-red    border-arena-red/40",
};

const DOT_CLASSES: Record<ChipColor, string> = {
  teal:   "bg-arena-teal",
  blue:   "bg-arena-blue",
  purple: "bg-arena-purple",
  pink:   "bg-arena-red",
  amber:  "bg-arena-amber",
  red:    "bg-arena-red",
};

export const ChipPill = forwardRef<HTMLSpanElement, ChipPillProps>(
  function ChipPill({ color = "teal", dot = true, className, children, ...rest }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border",
          "font-mono text-[10px] font-semibold tracking-wide",
          COLOR_CLASSES[color],
          className,
        )}
        {...rest}
      >
        {dot && (
          <span
            className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT_CLASSES[color])}
            aria-hidden
          />
        )}
        {children}
      </span>
    );
  },
);

ChipPill.displayName = "ChipPill";
