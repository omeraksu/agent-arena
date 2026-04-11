/**
 * MobileFrame — 420px max-width container for mobile-first layouts.
 *
 * Figma tasarımları 375-420px telefon genişliğinde kuruluyor. Desktop'ta
 * layout'u "ortalanmış telefon" olarak göstermek için bu container'ı kullan.
 * Mobile'da full-width, desktop'ta max-w-[420px] mx-auto.
 */
import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface MobileFrameProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function MobileFrame({ children, className, ...rest }: MobileFrameProps) {
  return (
    <div
      className={cn("w-full max-w-[420px] mx-auto", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

MobileFrame.displayName = "MobileFrame";
