/**
 * CornerMarks — Event Mode decorative corner brackets.
 *
 * Figma: 4 corner'a L-shape bracket çizgileri. Event Mode'un signature
 * "terminal frame" estetiği — ekranı kare bir boot-up gateway gibi gösterir.
 *
 * Fixed position, pointer-events-none. data-mode="event" içinde görünür,
 * Hub Mode'da render edilmez (veya opacity 0 kalır).
 */
import { cn } from "../../lib/cn";

export interface CornerMarksProps {
  /** Color accent — default teal */
  accent?: "teal" | "blue" | "purple" | "amber" | "red";
  /** Bracket length in px */
  size?: number;
  /** Padding from edge */
  inset?: number;
  className?: string;
}

const ACCENT_STROKE: Record<NonNullable<CornerMarksProps["accent"]>, string> = {
  teal:   "stroke-arena-teal",
  blue:   "stroke-arena-blue",
  purple: "stroke-arena-purple",
  amber:  "stroke-arena-amber",
  red:    "stroke-arena-red",
};

function Corner({
  rotate,
  size,
  inset,
  strokeClass,
  position,
}: {
  rotate: number;
  size: number;
  inset: number;
  strokeClass: string;
  position: { top?: number; right?: number; bottom?: number; left?: number };
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn("absolute", strokeClass)}
      style={{
        ...position,
        transform: `rotate(${rotate}deg)`,
      }}
      aria-hidden
    >
      <path
        d="M 2 20 L 2 2 L 20 2"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function CornerMarks({
  accent = "teal",
  size = 28,
  inset = 16,
  className,
}: CornerMarksProps) {
  const strokeClass = ACCENT_STROKE[accent];

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-30", className)}
      aria-hidden
    >
      {/* TL */}
      <Corner rotate={0}   size={size} inset={inset} strokeClass={strokeClass} position={{ top: inset,   left: inset   }} />
      {/* TR */}
      <Corner rotate={90}  size={size} inset={inset} strokeClass={strokeClass} position={{ top: inset,   right: inset  }} />
      {/* BR */}
      <Corner rotate={180} size={size} inset={inset} strokeClass={strokeClass} position={{ bottom: inset, right: inset }} />
      {/* BL */}
      <Corner rotate={270} size={size} inset={inset} strokeClass={strokeClass} position={{ bottom: inset, left: inset  }} />
    </div>
  );
}

CornerMarks.displayName = "CornerMarks";
