/**
 * Button — Arena design system primitive.
 *
 * 5 variant (primary, secondary, ghost, terminal, cta) × 3 size (sm, md, lg).
 * Tüm renkler arena.* token'larından gelir — hardcoded renk YOK.
 * Opacity standartı: /15 (muted surface), /8 (subtle hover), /90 (hover fill).
 *
 * Figma referansı: Section/Arena Components > Button
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "terminal"
  | "cta";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 font-semibold " +
  "transition-[background-color,border-color,color,box-shadow,transform] " +
  "duration-150 ease-out cursor-pointer select-none " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arena-red/60 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-arena-bg-base";

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-md",
  lg: "h-12 px-6 text-base rounded-md",
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Avalanche red CTA — her zaman aksiyon çağrısı
  primary:
    "bg-arena-red text-white hover:bg-arena-red/90 active:translate-y-px " +
    "shadow-[0_0_0_1px_rgba(232,65,66,0.4)]",

  // Subtle surface — ikincil aksiyonlar
  secondary:
    "bg-arena-bg-surface text-arena-text-primary border border-arena-text-muted " +
    "hover:bg-arena-bg-elevated hover:border-arena-text-tertiary",

  // Transparent — kartlar içindeki nötr aksiyonlar
  ghost:
    "bg-transparent text-arena-text-secondary border border-transparent " +
    "hover:bg-arena-bg-surface hover:text-arena-text-primary",

  // Event Mode terminal estetiği — JetBrains Mono + teal
  terminal:
    "font-mono bg-arena-bg-deep text-arena-teal border border-arena-teal/60 " +
    "hover:bg-arena-teal/15 hover:border-arena-teal tracking-wider uppercase",

  // Büyük highlight CTA — NFT claim, Core Wallet kurulum gibi KPI gate'leri
  cta:
    "bg-gradient-to-b from-arena-red to-[#c73536] text-white font-bold " +
    "hover:brightness-110 active:translate-y-px tracking-wide " +
    "shadow-[0_4px_16px_-4px_rgba(232,65,66,0.5)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      type = "button",
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          BASE_CLASSES,
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
