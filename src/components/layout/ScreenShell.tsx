/**
 * ScreenShell — Hub/Event mode switching container.
 *
 * Figma "ARIA Hub / Tokens" 2-mod variable collection'ını DOM'a yansıtır.
 * `data-mode` attribute ile `src/index.css > [data-mode="event"]` override'ını tetikler.
 *
 * Hub Mode:  sans-serif (Inter), bg-arena-bg-base, rounded-md
 * Event Mode: mono (JetBrains), bg-arena-bg-deep, rounded-sm, daha koyu palette
 *
 * Kullanım:
 *   <ScreenShell mode="hub">
 *     <Card>...</Card>
 *   </ScreenShell>
 */
import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type ScreenMode = "hub" | "event";

export interface ScreenShellProps extends HTMLAttributes<HTMLDivElement> {
  mode: ScreenMode;
  children: ReactNode;
  /** Üst bar slot'u (HUD, nav). Hub Mode'da görünür. */
  header?: ReactNode;
  /** Alt bar slot'u (BottomNav). Hub Mode'da görünür. */
  footer?: ReactNode;
  /** Tam ekran yüksekliğini kapatmak için. Default: true */
  fullHeight?: boolean;
}

export function ScreenShell({
  mode,
  children,
  header,
  footer,
  fullHeight = true,
  className,
  ...rest
}: ScreenShellProps) {
  return (
    <div
      data-mode={mode}
      className={cn(
        "flex flex-col bg-arena-bg-base text-arena-text-primary",
        mode === "hub"
          ? "font-sans transition-[background-color,color] duration-200 ease-out"
          : "font-mono transition-[background-color,color] duration-100 ease-in-out",
        fullHeight && "min-h-screen",
        className,
      )}
      {...rest}
    >
      {header ? <div className="shrink-0">{header}</div> : null}
      <main className="flex-1">{children}</main>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}

ScreenShell.displayName = "ScreenShell";
