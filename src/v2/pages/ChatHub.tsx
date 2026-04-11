/**
 * ChatHub — Chat tab wrapper, mobile-first (Faz 3).
 *
 * Figma: Chat/HubMode (71:2)
 *
 * Strateji: Mevcut `AgentChat.tsx` dokunulmadan wrap ediliyor.
 * AgentChat'in kendi state yönetimi (sessionId, messages) localStorage
 * tabanlı persistent — tab switch unmount/remount güvenli.
 *
 * Faz 3 v1: minimal header + topic suggestions + embedded AgentChat.
 * Faz 3 v2+: AgentChat'in kendi styling'ini mobile-first refactor (ayrı PR).
 */
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { ChipPill } from "../../components/ui";

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

// ─── Topic suggestion pills ─────────────────────────────────────────────

interface TopicPill {
  label: string;
  color: "teal" | "blue" | "purple" | "amber" | "red";
}

const TOPIC_PILLS: TopicPill[] = [
  { label: "DeFi nedir?", color: "purple" },
  { label: "NFT deploy", color: "amber" },
  { label: "Gas fees", color: "blue" },
  { label: "L1 vs L2", color: "teal" },
  { label: "Core Wallet", color: "red" },
];

const PILL_CLASSES: Record<TopicPill["color"], string> = {
  teal:   "bg-arena-teal/10   text-arena-teal   border-arena-teal/40   hover:bg-arena-teal/15",
  blue:   "bg-arena-blue/10   text-arena-blue   border-arena-blue/40   hover:bg-arena-blue/15",
  purple: "bg-arena-purple/10 text-arena-purple border-arena-purple/40 hover:bg-arena-purple/15",
  amber:  "bg-arena-amber/10  text-arena-amber  border-arena-amber/40  hover:bg-arena-amber/15",
  red:    "bg-arena-red/10    text-arena-red    border-arena-red/40    hover:bg-arena-red/15",
};

function ChatLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="font-mono text-xs text-arena-text-tertiary animate-pulse tracking-wider">
        AGENT_CHAT_LOADING...
      </div>
    </div>
  );
}

export default function ChatHub() {
  return (
    <div className="flex flex-col gap-5 pt-4 pb-6">
      {/* Header */}
      <header className="flex items-center gap-2">
        <Link
          to="/v2/hub"
          aria-label="Geri"
          className="-ml-2 h-10 w-10 flex items-center justify-center text-arena-text-secondary hover:text-arena-text-primary"
        >
          <BackIcon />
        </Link>
        <h1 className="flex-1 text-xl font-semibold text-arena-text-primary tracking-tight">
          Agent Chat
        </h1>
        <ChipPill color="teal">online</ChipPill>
      </header>

      {/* Topic suggestions */}
      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-arena-text-tertiary mb-2">
          Konu öner
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TOPIC_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              className={cn(
                "shrink-0 snap-start inline-flex items-center h-8 px-3 rounded-full border font-mono text-[11px] font-medium transition-colors",
                PILL_CLASSES[pill.color],
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* Embedded AgentChat — kendi sessionId/message state'i localStorage tabanlı */}
      <section className="-mx-4">
        <Suspense fallback={<ChatLoadingSpinner />}>
          <AgentChat />
        </Suspense>
      </section>
    </div>
  );
}
