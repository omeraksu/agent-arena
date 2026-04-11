/**
 * SessionComplete — Event Mode closing screen.
 *
 * Figma: SessionComplete (82:116)
 *
 * Yapı:
 *   - [SESSION_END] terminal header
 *   - "> etkinlik sona erdi. ama yolculuk devam ediyor."
 *   - Title: "SIRA SENDE." (Inter Black, massive)
 *   - Sub: "HUB'A GEÇ, ÖĞRENMEYE DEVAM ET"
 *   - Session Özeti card (4-value grid): Süre / Mesaj / Seviye + Öğrenilen + Kazanılan
 *   - "SIRADA NE VAR?" — 3 link cards (Günlük Quest / Free Chat / Academy)
 *   - HUB'A GİT primary CTA
 *   - Footer: "Core Wallet bağlı · seviye: Explorer" + "Artık bir ARIA üyesisin."
 */
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui";
import { cn } from "../../lib/cn";

// ─── Summary stat ───────────────────────────────────────────────────────

interface SummaryStat {
  label: string;
  value: string;
}

const SUMMARY: SummaryStat[] = [
  { label: "Süre",   value: "24 dk"    },
  { label: "Mesaj",  value: "12"       },
  { label: "Seviye", value: "Explorer" },
];

// ─── Next step card ─────────────────────────────────────────────────────

interface NextStep {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  accent: "purple" | "teal" | "blue";
}

const NEXT_STEPS: NextStep[] = [
  {
    icon: "◆",
    title: "Günlük Quest",
    subtitle: "Her gün yeni görev, XP kazan",
    href: "/v2/quest",
    accent: "purple",
  },
  {
    icon: ">_",
    title: "Free Chat",
    subtitle: "Agent her zaman hazır",
    href: "/v2/chat",
    accent: "teal",
  },
  {
    icon: "📚",
    title: "Academy",
    subtitle: "Avalanche kurslarına başla",
    href: "https://build.avax.network/academy",
    accent: "blue",
  },
];

const STEP_ACCENT_BORDER: Record<NextStep["accent"], string> = {
  purple: "border-arena-purple/30 hover:border-arena-purple/60",
  teal:   "border-arena-teal/30   hover:border-arena-teal/60",
  blue:   "border-arena-blue/30   hover:border-arena-blue/60",
};

const STEP_ACCENT_ICON: Record<NextStep["accent"], string> = {
  purple: "text-arena-purple",
  teal:   "text-arena-teal",
  blue:   "text-arena-blue",
};

function NextStepCard({ step }: { step: NextStep }) {
  const isExternal = step.href.startsWith("http");
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-sm border bg-arena-bg-surface/60 transition-colors",
        STEP_ACCENT_BORDER[step.accent],
      )}
    >
      <div
        className={cn(
          "h-10 w-10 shrink-0 rounded-sm border border-current flex items-center justify-center font-mono font-bold",
          STEP_ACCENT_ICON[step.accent],
        )}
        aria-hidden
      >
        {step.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-arena-text-primary leading-tight">
          {step.title}
        </div>
        <div className="font-mono text-[10px] text-arena-text-tertiary mt-1">
          {step.subtitle}
        </div>
      </div>
      <span className={cn("font-mono", STEP_ACCENT_ICON[step.accent])} aria-hidden>
        →
      </span>
    </div>
  );

  return isExternal ? (
    <a href={step.href} target="_blank" rel="noreferrer">{content}</a>
  ) : (
    <Link to={step.href}>{content}</Link>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function SessionComplete() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-7 pt-12 pb-8">
      {/* Terminal header */}
      <section className="font-mono text-[11px] leading-relaxed px-2">
        <div className="text-arena-teal font-bold">[SESSION_END]</div>
        <div className="text-arena-text-secondary mt-1">
          &gt; etkinlik sona erdi. ama yolculuk devam ediyor.
        </div>
      </section>

      {/* Massive title */}
      <section className="px-2">
        <h1 className="text-[64px] leading-[0.88] font-black tracking-tight text-arena-text-primary">
          SIRA
          <br />
          SENDE.
        </h1>
        <div className="font-mono text-[11px] font-bold tracking-widest text-arena-text-secondary mt-3">
          HUB&apos;A GEÇ, ÖĞRENMEYE DEVAM ET
        </div>
      </section>

      {/* Session summary card */}
      <section className="mx-2 p-5 rounded-sm border border-arena-teal/40 bg-arena-bg-surface/60">
        <div className="font-mono text-[10px] tracking-wider text-arena-teal mb-4">
          SESSION ÖZETİ
        </div>
        <div className="grid grid-cols-3 gap-3">
          {SUMMARY.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <div className="font-mono text-[9px] uppercase tracking-wider text-arena-text-tertiary">
                {stat.label}
              </div>
              <div className="text-[20px] font-bold text-arena-text-primary leading-tight">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-arena-text-muted/20 flex flex-col gap-2 font-mono text-[10px]">
          <div className="text-arena-text-secondary">
            Öğrenilen: <span className="text-arena-text-primary">consensus, DeFi, NFT, wallet</span>
          </div>
          <div className="text-arena-teal">
            Kazanılan: <span className="font-bold">ARIA #0042 NFT + 100 XP</span>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="mx-2">
        <div className="font-mono text-[10px] tracking-wider text-arena-text-tertiary mb-3">
          SIRADA NE VAR?
        </div>
        <div className="flex flex-col gap-2">
          {NEXT_STEPS.map((step) => (
            <NextStepCard key={step.href} step={step} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-2">
        <Button
          variant="terminal"
          size="lg"
          fullWidth
          onClick={() => navigate("/v2/hub")}
        >
          HUB&apos;A GİT ↗
        </Button>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center gap-1 text-center mt-2 font-mono">
        <div className="text-[10px] text-arena-teal">
          Core Wallet bağlı · seviye: Explorer
        </div>
        <div className="text-[11px] font-bold text-arena-text-primary mt-1">
          Artık bir ARIA üyesisin.
        </div>
      </footer>
    </div>
  );
}
