/**
 * Card — Arena design system primitive.
 *
 * 2 variant (default, active) × 2 padding size (md, lg).
 * Event Mode otomatik: ScreenShell data-mode="event" attribute'u altında
 * bg-arena-bg-surface değeri zaten kayıyor (index.css override).
 * Bu yüzden ayrı "event" variant'ı gerekmiyor — mode-aware.
 *
 * Figma referansı: Section/Arena Components > Card
 */
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type CardVariant = "default" | "active";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Hover interaction'ı açar (clickable kartlar için) */
  interactive?: boolean;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:
    "bg-arena-bg-surface border border-arena-text-muted/40 " +
    "text-arena-text-primary",

  active:
    "bg-arena-bg-elevated border border-arena-red/60 " +
    "text-arena-text-primary " +
    "shadow-[0_0_0_1px_rgba(232,65,66,0.15),0_8px_24px_-8px_rgba(232,65,66,0.25)]",
};

const INTERACTIVE_CLASSES =
  "cursor-pointer transition-[background-color,border-color,transform] " +
  "duration-200 ease-out hover:bg-arena-bg-elevated " +
  "hover:border-arena-text-tertiary active:translate-y-px";

/**
 * Event Mode'da radius küçük (rounded-sm = 2px), Hub Mode'da orta (rounded-md = 6px).
 * Bu geçişi Tailwind data-attribute variant'ı ile yapıyoruz.
 */
const RADIUS_CLASSES = "rounded-md data-[mode=event]:rounded-sm";

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(
    {
      variant = "default",
      padding = "md",
      interactive = false,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          RADIUS_CLASSES,
          VARIANT_CLASSES[variant],
          PADDING_CLASSES[padding],
          interactive && INTERACTIVE_CLASSES,
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";
