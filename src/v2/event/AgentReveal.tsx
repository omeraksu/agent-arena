/**
 * AgentReveal — Agent persona unveiling after profiling.
 *
 * Figma: AgentReveal (90:2)
 *
 * Yapı:
 *   - [AGENT_ASSIGNED] terminal header
 *   - Profile echo lines (beginner · learn → MENTOR)
 *   - Big agent card (mono frame, purple/teal glow):
 *     - glyph (>_)
 *     - "ARIA" (black)
 *     - "MENTOR MODE · #0001" subtitle
 *     - 2 character bullets
 *     - CAPABILITIES chip row (5 chips)
 *     - capability bar + "Orta" label
 *   - HUB'A GİT primary CTA
 *   - "// DİĞER MODLAR" section
 *   - 2 alternative mode cards (ARCADE GUIDE / HACKER)
 */
import { Link } from "react-router-dom";
import { Button } from "../../components/ui";
import { useEventFlow } from "./EventFlowProvider";
import { cn } from "../../lib/cn";

// ─── Capability chip ────────────────────────────────────────────────────

interface CapChip {
  label: string;
  color: "purple" | "teal" | "amber" | "blue" | "red";
}

const CAPS: CapChip[] = [
  { label: "quiz",     color: "purple" },
  { label: "faucet",   color: "teal"   },
  { label: "nft_mint", color: "amber"  },
  { label: "explorer", color: "blue"   },
  { label: "memory",   color: "red"    },
];

const CHIP_CLASSES: Record<CapChip["color"], string> = {
  purple: "bg-arena-purple/15 text-arena-purple border-arena-purple/60",
  teal:   "bg-arena-teal/15   text-arena-teal   border-arena-teal/60",
  amber:  "bg-arena-amber/15  text-arena-amber  border-arena-amber/60",
  blue:   "bg-arena-blue/15   text-arena-blue   border-arena-blue/60",
  red:    "bg-arena-red/15    text-arena-red    border-arena-red/60",
};

// ─── Alt mode card ──────────────────────────────────────────────────────

interface AltMode {
  name: string;
  subtitle: string;
  accent: "red" | "amber";
}

const ALT_MODES: AltMode[] = [
  { name: "ARCADE GUIDE", subtitle: "oyunlaştırılmış · eğlenceli", accent: "red" },
  { name: "HACKER",       subtitle: "teknik · builder odaklı",    accent: "amber" },
];

const ALT_BORDER: Record<AltMode["accent"], string> = {
  red:   "border-arena-red/40   hover:border-arena-red/80",
  amber: "border-arena-amber/40 hover:border-arena-amber/80",
};

const ALT_TEXT: Record<AltMode["accent"], string> = {
  red:   "text-arena-red",
  amber: "text-arena-amber",
};

// ─── Page ───────────────────────────────────────────────────────────────

export default function AgentReveal() {
  const { goNext } = useEventFlow();

  return (
    <div className="flex flex-col gap-6 pt-12 pb-8">
      {/* Terminal header */}
      <section className="font-mono text-[11px] leading-relaxed text-arena-teal px-2">
        <div className="font-bold">[AGENT_ASSIGNED]</div>
        <div className="mt-1">&gt; profil: beginner + learn → MENTOR</div>
        <div className="mt-3 text-arena-text-tertiary">
          &gt; experience: beginner ✓
        </div>
        <div className="text-arena-text-tertiary">&gt; intent: learn ✓</div>
        <div className="text-arena-text-tertiary">
          &gt; matching: MENTOR_MODE
        </div>
      </section>

      {/* Agent card — framed with teal glow */}
      <section className="relative mx-2 p-6 rounded-sm border-2 border-arena-teal/60 bg-arena-bg-surface/60">
        <div className="flex flex-col items-center gap-4">
          {/* Glyph */}
          <div className="h-20 w-20 rounded-sm border-2 border-arena-teal flex items-center justify-center bg-arena-bg-deep">
            <span className="font-mono text-3xl font-bold text-arena-teal" aria-hidden>
              &gt;_
            </span>
          </div>

          {/* Name */}
          <h2 className="text-[44px] leading-none font-black tracking-tight text-arena-text-primary">
            ARIA
          </h2>

          {/* Mode line */}
          <div className="font-mono text-[11px] font-bold tracking-wider text-arena-teal">
            MENTOR MODE · #0001
          </div>
        </div>

        {/* Bullets */}
        <div className="mt-5 flex flex-col gap-1.5 font-mono text-[11px] text-arena-text-secondary">
          <div>&gt; öğretici · kavramları açıklar</div>
          <div>&gt; sorularla ilerler · sabırlı</div>
        </div>

        {/* Capabilities */}
        <div className="mt-5">
          <div className="font-mono text-[10px] text-arena-text-tertiary mb-2">
            // CAPABILITIES
          </div>
          <div className="flex flex-wrap gap-2">
            {CAPS.map((cap) => (
              <span
                key={cap.label}
                className={cn(
                  "inline-flex items-center h-6 px-2 rounded-sm border font-mono text-[10px] font-bold",
                  CHIP_CLASSES[cap.color],
                )}
              >
                {cap.label}
              </span>
            ))}
          </div>
        </div>

        {/* Capability bar — "Orta" level */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex gap-1">
            <span className="h-1 w-8 rounded-full bg-arena-teal" />
            <span className="h-1 w-8 rounded-full bg-arena-teal" />
            <span className="h-1 w-8 rounded-full bg-arena-teal" />
            <span className="h-1 w-8 rounded-full bg-arena-text-muted/30" />
            <span className="h-1 w-8 rounded-full bg-arena-text-muted/30" />
          </div>
          <span className="font-mono text-[10px] text-arena-text-tertiary">Orta</span>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-2">
        <Button variant="terminal" size="lg" fullWidth onClick={goNext}>
          HUB&apos;A GİT ↗
        </Button>
      </section>

      {/* Alt modes */}
      <section className="mx-2 mt-2">
        <div className="font-mono text-[10px] text-arena-text-tertiary mb-3">
          // DİĞER MODLAR
        </div>
        <div className="flex flex-col gap-2">
          {ALT_MODES.map((mode) => (
            <button
              key={mode.name}
              type="button"
              className={cn(
                "flex items-center justify-between p-4 rounded-sm border transition-colors bg-arena-bg-surface/60",
                ALT_BORDER[mode.accent],
              )}
            >
              <div className="flex flex-col items-start">
                <span className={cn("font-mono text-[11px] font-bold tracking-wider", ALT_TEXT[mode.accent])}>
                  {mode.name}
                </span>
                <span className="font-mono text-[10px] text-arena-text-tertiary mt-1">
                  {mode.subtitle}
                </span>
              </div>
              <span className={cn("font-mono", ALT_TEXT[mode.accent])} aria-hidden>
                →
              </span>
            </button>
          ))}
        </div>
        <div className="font-mono text-[9px] text-arena-text-tertiary/70 text-center mt-4">
          &gt; Profil sonucuna göre önerildi
        </div>
      </section>

      {/* Dev skip (only visible in dev) */}
      {import.meta.env.DEV && (
        <div className="mx-2 mt-4 pt-4 border-t border-arena-text-muted/20">
          <Link
            to="/v2/event/complete"
            className="font-mono text-[9px] text-arena-text-tertiary/60 hover:text-arena-text-secondary"
          >
            [dev] skip → session_complete
          </Link>
        </div>
      )}
    </div>
  );
}
