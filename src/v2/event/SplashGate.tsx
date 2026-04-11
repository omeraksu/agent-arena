/**
 * SplashGate — Event Mode entry screen.
 *
 * Figma: SplashGate (82:3)
 *
 * Yapı:
 *   - Terminal boot sequence (4 satır, mono teal)
 *   - ARIA glyph (>_ in box) + secondary circle
 *   - "ARIA HUB" big wordmark (Inter Black)
 *   - "> blockchain_education_arena" subtitle
 *   - Event card (purple border): BUILDER NIGHT / Kozalak Hub · Bursa / tarih
 *   - Toggle: "> ilk_avalanche_etkinliğin_mi?" (Y/N)
 *   - HUB'A GİT primary CTA (terminal style)
 *   - "> paylaş" ghost
 *   - Footer: "zaten hesabın var? giriş yap" + "gasless · fuji testnet" + "powered by AVALANCHE"
 */
import { useState } from "react";
import { Button } from "../../components/ui";
import { useEventFlow } from "./EventFlowProvider";
import { cn } from "../../lib/cn";
import { brand } from "../../config/brand";

// ─── Boot line typewriter ───────────────────────────────────────────────

const BOOT_LINES = [
  "> SYSTEM_BOOT",
  "> loading: event_module",
  "> connecting: avalanche_fuji",
  "> status: LIVE ●",
];

// ─── Page ───────────────────────────────────────────────────────────────

export default function SplashGate() {
  const { goNext } = useEventFlow();
  const [firstTime, setFirstTime] = useState<"Y" | "N" | null>(null);

  return (
    <div className="flex flex-col gap-8 pt-12 pb-8">
      {/* Boot sequence */}
      <section className="font-mono text-[11px] leading-relaxed text-arena-teal px-2">
        {BOOT_LINES.map((line, i) => (
          <div key={i} className={cn(i === BOOT_LINES.length - 1 && "font-bold")}>
            {line}
          </div>
        ))}
      </section>

      {/* ARIA glyph + secondary orb */}
      <section className="relative flex items-center justify-center gap-6 py-4">
        <div className="h-24 w-24 rounded-md border-2 border-arena-teal flex items-center justify-center bg-arena-bg-deep">
          <span className="font-mono text-4xl font-bold text-arena-teal" aria-hidden>
            &gt;_
          </span>
        </div>
        <div className="h-24 w-24 rounded-full border border-arena-text-muted/40 bg-arena-bg-surface/40" aria-hidden />
      </section>

      {/* Wordmark + tagline */}
      <section className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[64px] leading-[0.9] font-black tracking-tight text-arena-text-primary">
          ARIA
          <br />
          HUB
        </h1>
        <div className="font-mono text-[11px] text-arena-text-secondary mt-3">
          &gt; {brand.productTagline}
        </div>
      </section>

      {/* Event card */}
      <section className="mx-2 p-4 rounded-sm border border-arena-purple/60 bg-arena-bg-surface/60">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-arena-purple" aria-hidden />
          <span className="font-mono text-[11px] font-bold tracking-wider text-arena-amber">
            BUILDER NIGHT
          </span>
        </div>
        <div className="font-mono text-[10px] text-arena-text-secondary">
          KOZALAK HUB · BURSA
        </div>
        <div className="font-mono text-[10px] text-arena-text-tertiary mt-1">
          11 NİSAN 2025 · 19:00
        </div>
      </section>

      {/* First time toggle */}
      <section className="mx-2 p-3 rounded-sm border border-arena-text-muted/30 bg-arena-bg-deep">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-arena-text-secondary">
            &gt; ilk_avalanche_etkinliğin_mi?
          </span>
          <div className="flex gap-1 shrink-0">
            {(["Y", "N"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setFirstTime(v)}
                aria-pressed={firstTime === v}
                className={cn(
                  "h-7 w-8 rounded-sm font-mono text-[11px] font-bold transition-colors",
                  firstTime === v
                    ? "bg-arena-teal text-arena-bg-deep"
                    : "bg-arena-bg-surface text-arena-text-tertiary hover:text-arena-text-primary border border-arena-text-muted/30",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="flex flex-col gap-3 mx-2">
        <Button variant="terminal" size="lg" fullWidth onClick={goNext}>
          HUB&apos;A GİT ↗
        </Button>
        <Button variant="ghost" size="md" fullWidth>
          &gt; paylaş
        </Button>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-2 text-center mt-2">
        <a
          href="#"
          className="font-mono text-[10px] text-arena-text-tertiary hover:text-arena-text-secondary underline underline-offset-4"
        >
          &gt; zaten hesabın var? giriş yap
        </a>
        <div className="font-mono text-[9px] text-arena-text-tertiary/70">
          gasless · fuji testnet
        </div>
        <div className="font-mono text-[9px] font-bold text-arena-red tracking-widest">
          POWERED BY AVALANCHE
        </div>
      </footer>
    </div>
  );
}
