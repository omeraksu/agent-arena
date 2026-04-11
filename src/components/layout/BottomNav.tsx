/**
 * BottomNav — 4-tab fixed bottom navigation.
 *
 * Figma referansı: MemberHub/Home (69:3) — 4 tab: Hub / Quest / Chat / Profil
 * Yükseklik: 64px (h-16). max-w-[420px] mobile-frame ile hizalı.
 * Aktif tab: `text-arena-teal`. Pasif: `text-arena-text-tertiary`.
 *
 * `useLocation` ile aktif tab otomatik `NavLink` tarafından yönetilir.
 * V2 route'larıyla çalışır (`/v2/hub`, `/v2/quest`, `/v2/chat`, `/v2/profile`).
 */
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

function HexIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 2 L22 12 L12 22 L2 12 Z" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 10 12 4 17" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M5.5 19.5c1.2-2.5 3.8-4 6.5-4s5.3 1.5 6.5 4" strokeLinecap="round" />
    </svg>
  );
}

const ITEMS: NavItem[] = [
  { to: "/v2/hub", label: "Hub", icon: <HexIcon /> },
  { to: "/v2/quest", label: "Quest", icon: <DiamondIcon /> },
  { to: "/v2/chat", label: "Chat", icon: <TerminalIcon /> },
  { to: "/v2/profile", label: "Profil", icon: <ProfileIcon /> },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Ana menü"
      className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-arena-bg-surface/95 backdrop-blur-sm border-t border-arena-text-muted/30"
    >
      <div className="mx-auto max-w-[420px] h-full flex">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
                isActive
                  ? "text-arena-teal"
                  : "text-arena-text-tertiary hover:text-arena-text-secondary",
              )
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

BottomNav.displayName = "BottomNav";
