/**
 * QuestCard — List variant for QuestArena screen.
 *
 * Figma: QuestArena (70:2) — quest satırları.
 * 3 status: done / active / locked.
 * Sol kenarda 4px colored rail, status icon, title + subtitle, optional
 * progress bar, +XP pill sağda.
 *
 * Compact variant (2-column Hub grid) için ayrı: QuestTodayCard.tsx
 */
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import type { QuestCatalogItem, QuestStatus } from "../lib/quest-catalog";
import type { ChipColor } from "../../components/ui";

export interface QuestCardProps {
  quest: QuestCatalogItem;
}

// ─── Status icon ────────────────────────────────────────────────────────

function StatusIcon({ status, accent }: { status: QuestStatus; accent: ChipColor }) {
  const ringClass =
    status === "done"
      ? "border-arena-teal bg-arena-teal/15 text-arena-teal"
      : status === "active"
        ? ACCENT_ACTIVE[accent]
        : "border-arena-text-muted/50 bg-arena-bg-elevated text-arena-text-tertiary";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center h-6 w-6 rounded-full border-2 shrink-0",
        ringClass,
      )}
      aria-hidden
    >
      {status === "done" && (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 8 7 12 13 4" />
        </svg>
      )}
      {status === "locked" && (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="10" height="7" rx="1" />
          <path d="M5 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      )}
    </span>
  );
}

const ACCENT_ACTIVE: Record<ChipColor, string> = {
  teal:   "border-arena-teal/80   bg-arena-teal/10   text-arena-teal",
  blue:   "border-arena-blue/80   bg-arena-blue/10   text-arena-blue",
  purple: "border-arena-purple/80 bg-arena-purple/10 text-arena-purple",
  pink:   "border-arena-red/80    bg-arena-red/10    text-arena-red",
  amber:  "border-arena-amber/80  bg-arena-amber/10  text-arena-amber",
  red:    "border-arena-red/80    bg-arena-red/10    text-arena-red",
};

const ACCENT_RAIL: Record<ChipColor, string> = {
  teal:   "bg-arena-teal",
  blue:   "bg-arena-blue",
  purple: "bg-arena-purple",
  pink:   "bg-arena-red",
  amber:  "bg-arena-amber",
  red:    "bg-arena-red",
};

const ACCENT_TEXT: Record<ChipColor, string> = {
  teal:   "text-arena-teal",
  blue:   "text-arena-blue",
  purple: "text-arena-purple",
  pink:   "text-arena-red",
  amber:  "text-arena-amber",
  red:    "text-arena-red",
};

const ACCENT_PILL: Record<ChipColor, string> = {
  teal:   "bg-arena-teal/15   text-arena-teal   border-arena-teal/40",
  blue:   "bg-arena-blue/15   text-arena-blue   border-arena-blue/40",
  purple: "bg-arena-purple/15 text-arena-purple border-arena-purple/40",
  pink:   "bg-arena-red/15    text-arena-red    border-arena-red/40",
  amber:  "bg-arena-amber/15  text-arena-amber  border-arena-amber/40",
  red:    "bg-arena-red/15    text-arena-red    border-arena-red/40",
};

// ─── Progress bar (quest variant — thin, accent colored) ────────────────

function QuestProgressBar({ current, total, accent }: { current: number; total: number; accent: ChipColor }) {
  const ratio = Math.min(1, Math.max(0, total > 0 ? current / total : 0));
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 rounded-full bg-arena-bg-elevated overflow-hidden">
        <div
          className={cn("h-full rounded-full", ACCENT_RAIL[accent])}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className={cn("font-mono text-[10px] font-bold tabular-nums", ACCENT_TEXT[accent])}>
        {current}/{total}
      </span>
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────

export function QuestCard({ quest }: QuestCardProps) {
  const isLocked = quest.status === "locked";
  const isDone = quest.status === "done";

  const content = (
    <div
      className={cn(
        "relative flex gap-3 p-4 rounded-md border border-arena-text-muted/25",
        "bg-arena-bg-surface",
        !isLocked && "hover:bg-arena-bg-elevated transition-colors",
        isLocked && "opacity-55",
        isDone && "opacity-70",
      )}
    >
      {/* Left rail accent */}
      <span
        className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", ACCENT_RAIL[quest.accent])}
        aria-hidden
      />

      {/* Status icon */}
      <div className="pl-1">
        <StatusIcon status={quest.status} accent={quest.accent} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn(
            "text-[15px] font-semibold leading-tight",
            isLocked ? "text-arena-text-secondary" : "text-arena-text-primary",
          )}>
            {quest.title}
          </h3>
          <span
            className={cn(
              "inline-flex items-center h-6 px-2 rounded-full border font-mono text-[10px] font-bold whitespace-nowrap shrink-0",
              ACCENT_PILL[quest.accent],
            )}
          >
            +{quest.xp} XP
          </span>
        </div>

        <p className="text-[12px] text-arena-text-tertiary leading-snug mt-1">
          {quest.subtitle}
        </p>

        {quest.progress && (
          <QuestProgressBar
            current={quest.progress.current}
            total={quest.progress.total}
            accent={quest.accent}
          />
        )}

        {quest.completedText && (
          <div className="mt-2 font-mono text-[10px] text-arena-teal">
            {quest.completedText}
          </div>
        )}

        {quest.lockedHint && (
          <div className="mt-2 font-mono text-[10px] text-arena-text-tertiary">
            {quest.lockedHint} →
          </div>
        )}
      </div>
    </div>
  );

  if (isLocked) return content;
  return (
    <Link to={`/v2/quest/${quest.id}`} className="block">
      {content}
    </Link>
  );
}

QuestCard.displayName = "QuestCard";
