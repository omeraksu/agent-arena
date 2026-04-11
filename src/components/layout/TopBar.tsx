/**
 * TopBar — Hub Mode sticky top header.
 *
 * Figma referansı: MemberHub/Home (69:3)
 * Yapı: [Hamburger] [ARIA wordmark] ··· [XP Badge] [Notif Bell]
 * Yükseklik: 56px (h-14).
 *
 * XP/level/notif değerleri prop olarak gelir; Faz 2'de `useXP()` hook'u ile
 * client-side data'dan beslenecek.
 */
import { useState, type ReactNode } from "react";
import { brand } from "../../config/brand";
import { cn } from "../../lib/cn";
import { HamburgerDrawer } from "./HamburgerDrawer";

export interface TopBarProps {
  xp?: number;
  level?: number;
  notifCount?: number;
  className?: string;
  rightSlot?: ReactNode;
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="17" y2="6" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="14" x2="17" y2="14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M8.5 16a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

export function TopBar({
  xp = 0,
  level = 1,
  notifCount = 0,
  className,
  rightSlot,
}: TopBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 h-14 flex items-center justify-between px-4",
          "bg-arena-bg-base/90 backdrop-blur-sm",
          "border-b border-arena-text-muted/20",
          className,
        )}
      >
        {/* Left: hamburger + wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Menüyü aç"
            className="h-10 w-10 -ml-2 flex items-center justify-center text-arena-text-secondary hover:text-arena-text-primary transition-colors"
          >
            <MenuIcon />
          </button>
          <span className="font-mono text-base font-bold tracking-tight text-arena-text-primary">
            {brand.productShort}
          </span>
        </div>

        {/* Right: XP badge + notif + optional slot */}
        <div className="flex items-center gap-2">
          {rightSlot}

          {xp > 0 && (
            <div className="inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-full bg-arena-amber/15 border border-arena-amber/40">
              <span className="h-2 w-2 rounded-full bg-arena-amber" aria-hidden />
              <span className="font-mono text-[10px] font-bold text-arena-amber whitespace-nowrap">
                {level} · {xp}
              </span>
            </div>
          )}

          <button
            aria-label="Bildirimler"
            className="relative h-10 w-10 -mr-2 flex items-center justify-center text-arena-text-secondary hover:text-arena-text-primary transition-colors"
          >
            <BellIcon />
            {notifCount > 0 && (
              <span
                className="absolute top-2 right-2 h-2 w-2 rounded-full bg-arena-red"
                aria-label={`${notifCount} okunmamış bildirim`}
              />
            )}
          </button>
        </div>
      </header>

      <HamburgerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

TopBar.displayName = "TopBar";
