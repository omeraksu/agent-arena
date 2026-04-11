/**
 * EventChat — Event Mode chat wrapper with persuasion overlay.
 *
 * Figma: ChatSession (85:37)
 *
 * Mevcut `AgentChat.tsx` embed ediliyor — pazarlıkçı ajan logic'i, mint flow'u,
 * tool calling, onboarding steps HEPSİ korunuyor.
 * Üstüne Event Mode görsel öğeleri ekleniyor:
 *   - Terminal header: "> ARIA_CHAT // {archetype}" + persuasion% chip
 *   - PERSUASION meter card (şu an mock, Faz 6'da gerçek)
 *   - Corner marks zaten EventShell tarafından render ediliyor
 *
 * Gerçek mint akışı AgentChat içinde gerçekleşir, `[MINT_APPROVED]` ile
 * tool call tetiklenir. User navigate /v2/event/reward yaparak RewardGate'e
 * geçer (şu an manuel link; Faz 6'da otomatik listener).
 */
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { SkipGate } from "../../components/ui";
import { useEventFlow } from "./EventFlowProvider";

const AgentChat = lazy(() => import("../../components/AgentChat"));

// ─── Back icon ──────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Mock persuasion meter (Faz 6'da ArenaContext'ten beslenir) ─────────

function PersuasionMeter({ percent }: { percent: number }) {
  return (
    <div className="relative p-3 rounded-sm border border-arena-amber/50 bg-arena-bg-deep">
      <div className="absolute -top-2 right-3 px-1.5 py-0.5 rounded-sm bg-arena-bg-deep font-mono text-[9px] font-bold text-arena-teal">
        +8%
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] font-bold tracking-wider text-arena-amber">
          PERSUASION
        </span>
        <span className="font-mono text-[24px] font-black leading-none text-arena-teal tabular-nums">
          {percent}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-arena-bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-arena-purple via-arena-amber to-arena-teal transition-[width] duration-500"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

// ─── Loading fallback ──────────────────────────────────────────────────

function ChatLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="font-mono text-xs text-arena-teal animate-pulse tracking-wider">
        AGENT_BOOTING...
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function EventChat() {
  const { goNext } = useEventFlow();

  return (
    <div className="flex flex-col gap-5 pt-8 pb-6">
      {/* Terminal header */}
      <header className="flex items-center gap-3 px-2">
        <Link
          to="/v2/event/reveal"
          aria-label="Geri"
          className="-ml-2 h-10 w-10 flex items-center justify-center text-arena-teal hover:text-arena-text-primary"
        >
          <BackIcon />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[11px] text-arena-teal">
            &gt; ARIA_CHAT <span className="text-arena-text-tertiary">// hacker</span>
          </div>
          <div className="font-mono text-[9px] text-arena-text-tertiary mt-0.5">
            KOZALAK HUB · BUILDER NIGHT · LIVE
          </div>
        </div>
      </header>

      {/* Persuasion meter */}
      <section className="mx-2">
        <PersuasionMeter percent={66} />
      </section>

      {/* AgentChat embedded — gerçek pazarlıkçı ajan + mint flow */}
      <section className="-mx-4">
        <Suspense fallback={<ChatLoadingSpinner />}>
          <AgentChat />
        </Suspense>
      </section>

      {/* Manual next — mint approved olduğunda kullanılır */}
      <section className="mx-2 mt-2">
        <button
          type="button"
          onClick={goNext}
          className={cn(
            "w-full h-10 rounded-sm border border-arena-amber/60 bg-arena-amber/10",
            "font-mono text-[11px] font-bold tracking-wider text-arena-amber",
            "hover:bg-arena-amber/20 transition-colors",
          )}
        >
          MINT HAZIR → RewardGate
        </button>
      </section>

      <SkipGate onSkip={goNext} label="[dev] skip → reward" />
    </div>
  );
}
