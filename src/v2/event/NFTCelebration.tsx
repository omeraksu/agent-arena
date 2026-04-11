/**
 * NFTCelebration — Post-claim confirmation screen.
 *
 * Figma: NFTCelebration (82:58)
 *
 * Yapı:
 *   - [NFT_CLAIMED] terminal header + "> tx: 0x... · confirmed"
 *   - "NFT'İN SENİN!" massive title
 *   - Big NFT card (amber border with teal corner brackets, ambient particles)
 *   - // SESSION_STATS — 3 stat cards (Persuasion / Sorular / XP)
 *   - "> paylaş" ghost + "HUB'A GİT ↗" terminal primary
 *   - "> avalanche ekosistemini keşfet" link
 *   - Footer: "Avalanche Fuji Testnet" + "Core Wallet · 0x..."
 */
import { useNavigate } from "react-router-dom";
import { useActiveAccount } from "thirdweb/react";
import { Button, SkipGate } from "../../components/ui";
import { useEventFlow } from "./EventFlowProvider";
import { cn } from "../../lib/cn";

// ─── Confetti particles (CSS-only, decorative) ──────────────────────────

const PARTICLE_POSITIONS = [
  { top: "10%", left: "15%",  color: "bg-arena-teal",   size: 6 },
  { top: "18%", left: "78%",  color: "bg-arena-amber",  size: 5 },
  { top: "28%", left: "8%",   color: "bg-arena-purple", size: 4 },
  { top: "35%", left: "88%",  color: "bg-arena-red",    size: 5 },
  { top: "48%", left: "5%",   color: "bg-arena-blue",   size: 6 },
  { top: "52%", left: "92%",  color: "bg-arena-teal",   size: 4 },
  { top: "62%", left: "12%",  color: "bg-arena-amber",  size: 5 },
  { top: "68%", left: "82%",  color: "bg-arena-purple", size: 6 },
];

function ConfettiLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {PARTICLE_POSITIONS.map((p, i) => (
        <span
          key={i}
          className={cn("absolute rounded-full opacity-70", p.color)}
          style={{
            top: p.top,
            left: p.left,
            height: `${p.size}px`,
            width: `${p.size}px`,
          }}
        />
      ))}
    </div>
  );
}

// ─── NFT card (celebration variant — glow background) ──────────────────

function NFTHeroCard() {
  return (
    <div className="relative mx-auto w-[220px] aspect-[4/5]">
      {/* Amber glow backdrop */}
      <div className="absolute inset-0 rounded-sm bg-arena-amber/10 blur-2xl" aria-hidden />

      {/* Card frame */}
      <div className="relative h-full w-full rounded-sm border-2 border-arena-amber bg-arena-bg-deep overflow-hidden">
        {/* Corner brackets */}
        <span className="absolute top-0 left-0 h-5 w-5 border-t-2 border-l-2 border-arena-teal" aria-hidden />
        <span className="absolute top-0 right-0 h-5 w-5 border-t-2 border-r-2 border-arena-teal" aria-hidden />
        <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-arena-teal" aria-hidden />
        <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-arena-teal" aria-hidden />

        <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
          <span className="font-mono text-[56px] leading-none font-bold text-arena-amber" aria-hidden>
            &gt;_&lt;
          </span>
          <div className="mt-2 font-mono text-[11px] font-bold tracking-wider text-arena-amber">
            ARIA #0042
          </div>
          <div className="font-mono text-[9px] text-arena-text-tertiary text-center">
            Builder Night · Kozalak Hub
          </div>
          <div className="font-mono text-[9px] text-arena-text-tertiary/70">
            11 Nis 2025
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat tile (3-column) ──────────────────────────────────────────────

interface StatTile {
  label: string;
  value: string;
  color: "teal" | "blue" | "amber";
}

const STATS: StatTile[] = [
  { label: "Persuasion", value: "92%",  color: "teal"  },
  { label: "Sorular",    value: "7/7",  color: "blue"  },
  { label: "XP",         value: "+100", color: "amber" },
];

const STAT_TEXT: Record<StatTile["color"], string> = {
  teal:   "text-arena-teal",
  blue:   "text-arena-blue",
  amber:  "text-arena-amber",
};

function StatTileComp({ tile }: { tile: StatTile }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-sm border border-arena-text-muted/25 bg-arena-bg-surface/60">
      <div className="font-mono text-[9px] uppercase tracking-wider text-arena-text-tertiary">
        {tile.label}
      </div>
      <div className={cn("text-[20px] font-bold tabular-nums", STAT_TEXT[tile.color])}>
        {tile.value}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function NFTCelebration() {
  const { goNext } = useEventFlow();
  const navigate = useNavigate();
  const account = useActiveAccount();

  const displayAddress = account?.address
    ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : "0x7f3a...b2c1";

  return (
    <div className="relative flex flex-col gap-7 pt-12 pb-8">
      <ConfettiLayer />

      {/* Terminal header */}
      <section className="relative font-mono text-[11px] leading-relaxed px-2">
        <div className="text-arena-teal font-bold">[NFT_CLAIMED]</div>
        <div className="text-arena-text-secondary mt-1 truncate">
          &gt; tx: {displayAddress} · confirmed
        </div>
      </section>

      {/* Massive title */}
      <section className="relative px-2">
        <h1 className="text-[64px] leading-[0.88] font-black tracking-tight text-arena-text-primary">
          NFT&apos;İN
          <br />
          SENİN!
        </h1>
      </section>

      {/* Hero NFT card */}
      <section className="relative">
        <NFTHeroCard />
      </section>

      {/* Session stats */}
      <section className="relative mx-2">
        <div className="font-mono text-[10px] tracking-wider text-arena-text-tertiary mb-3">
          // SESSION_STATS
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STATS.map((tile) => (
            <StatTileComp key={tile.label} tile={tile} />
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="relative mx-2 flex flex-col gap-3">
        <Button variant="ghost" size="md" fullWidth>
          &gt; paylaş
        </Button>
        <Button
          variant="terminal"
          size="lg"
          fullWidth
          onClick={() => goNext()}
        >
          HUB&apos;A GİT ↗
        </Button>
      </section>

      {/* External link */}
      <div className="relative text-center">
        <a
          href="https://cascade.team1.network"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] text-arena-text-tertiary hover:text-arena-text-secondary underline underline-offset-4"
        >
          &gt; avalanche ekosistemini keşfet
        </a>
      </div>

      {/* Footer */}
      <footer className="relative flex flex-col items-center gap-1 text-center mt-2 font-mono">
        <div className="text-[10px] text-arena-text-tertiary">
          Avalanche Fuji Testnet
        </div>
        <div className="text-[10px] text-arena-teal">
          Core Wallet · {displayAddress}
        </div>
      </footer>

      <SkipGate
        onSkip={() => navigate("/v2/hub")}
        label="[dev] skip → hub"
      />
    </div>
  );
}
