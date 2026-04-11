/**
 * HamburgerDrawer — Sol slide-in menu panel.
 *
 * İçerik: "Diğer araçlar" (legacy modules: Wallet, Meme Arena, Signal Pulse, Agents)
 * + "Admin" (Instructor Panel).
 *
 * Figma'da bu component doğrudan yok; gap item 5 olarak tasarım ihtiyaçları
 * listesinde. Mobile-first IA'da kritik — legacy route'lara tek erişim noktası.
 *
 * A11y:
 * - Escape kapatır
 * - Backdrop click kapatır
 * - Body scroll kilitlenir
 * - aria-hidden state yönetilir
 */
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn";

export interface HamburgerDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface DrawerLink {
  label: string;
  to: string;
  icon: string;
}

const LEGACY_TOOLS: DrawerLink[] = [
  { label: "Cüzdan", to: "/wallet", icon: "💳" },
  { label: "Meme Arena", to: "/meme-arena", icon: "🎨" },
  { label: "Signal Pulse", to: "/signal-pulse", icon: "⚡" },
  { label: "Agent Network", to: "/agents", icon: "🌐" },
];

const ADMIN_TOOLS: DrawerLink[] = [
  { label: "Instructor Panel", to: "/instructor", icon: "🎛" },
];

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="5" x2="15" y2="15" />
      <line x1="15" y1="5" x2="5" y2="15" />
    </svg>
  );
}

export function HamburgerDrawer({ open, onClose }: HamburgerDrawerProps) {
  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        aria-hidden={!open}
        aria-label="Menü"
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw]",
          "bg-arena-bg-surface border-r border-arena-text-muted/40",
          "transform transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-arena-text-muted/30">
          <span className="font-mono text-sm font-bold tracking-wider text-arena-text-primary">
            MENÜ
          </span>
          <button
            onClick={onClose}
            aria-label="Menüyü kapat"
            className="h-8 w-8 flex items-center justify-center text-arena-text-secondary hover:text-arena-text-primary transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 flex flex-col gap-0.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-arena-text-tertiary px-3 py-2">
            Diğer araçlar
          </div>
          {LEGACY_TOOLS.map((tool) => (
            <NavLink
              key={tool.to}
              to={tool.to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-arena-text-secondary hover:bg-arena-bg-elevated hover:text-arena-text-primary transition-colors"
            >
              <span className="text-lg" aria-hidden>{tool.icon}</span>
              <span className="text-sm">{tool.label}</span>
            </NavLink>
          ))}

          <div className="h-px bg-arena-text-muted/20 my-3 mx-3" />

          <div className="text-[10px] font-mono uppercase tracking-wider text-arena-text-tertiary px-3 py-2">
            Admin
          </div>
          {ADMIN_TOOLS.map((tool) => (
            <NavLink
              key={tool.to}
              to={tool.to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-arena-text-secondary hover:bg-arena-bg-elevated hover:text-arena-text-primary transition-colors"
            >
              <span className="text-lg" aria-hidden>{tool.icon}</span>
              <span className="text-sm">{tool.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

HamburgerDrawer.displayName = "HamburgerDrawer";
