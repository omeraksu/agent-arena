/**
 * QuestArena — Daily + weekly quest list (Faz 3 full).
 *
 * Figma: QuestArena (70:2)
 *
 * Yapı:
 *   1. Header: [← back] "Quest Arena" + "X/Y bugün" pill
 *   2. GÜNLÜK GÖREVLER — daily countdown + 3 QuestCard
 *   3. HAFTALIK GÖREVLER — 3 gün kaldı + 2 QuestCard
 *   4. BU HAFTA KAZANILAN — 3-column stat grid
 */
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { ChipPill } from "../../components/ui";
import { QuestCard } from "../components/QuestCard";
import {
  getDailyQuests,
  getWeeklyQuests,
  countCompletedToday,
  countTotalToday,
} from "../lib/quest-catalog";

// ─── Back arrow icon ────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Stat grid tile ─────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string;
  color: "teal" | "purple" | "amber" | "blue" | "red";
}

const STAT_TEXT_CLASSES: Record<StatTileProps["color"], string> = {
  teal:   "text-arena-teal",
  purple: "text-arena-purple",
  amber:  "text-arena-amber",
  blue:   "text-arena-blue",
  red:    "text-arena-red",
};

function StatTile({ label, value, color }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-md border border-arena-text-muted/25 bg-arena-bg-surface">
      <div className="font-mono text-[9px] uppercase tracking-wider text-arena-text-tertiary">
        {label}
      </div>
      <div className={cn("text-xl font-bold tabular-nums", STAT_TEXT_CLASSES[color])}>
        {value}
      </div>
    </div>
  );
}

// ─── Section title with side meta ──────────────────────────────────────

function SectionHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-arena-text-tertiary">
        {title}
      </h2>
      {meta && (
        <span className="font-mono text-[9px] text-arena-text-tertiary/80">
          {meta}
        </span>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function QuestArena() {
  const daily = getDailyQuests();
  const weekly = getWeeklyQuests();
  const doneCount = countCompletedToday();
  const totalCount = countTotalToday();

  return (
    <div className="flex flex-col gap-8 pt-4 pb-6">
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
          Quest Arena
        </h1>
        <ChipPill color="purple" dot={false}>
          {doneCount}/{totalCount} bugün
        </ChipPill>
      </header>

      {/* Daily quests */}
      <section>
        <SectionHeader title="Günlük görevler" meta="Yenilenir: 14s 22dk" />
        <div className="flex flex-col gap-3">
          {daily.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      </section>

      {/* Weekly quests */}
      <section>
        <SectionHeader title="Haftalık görevler" meta="3 gün kaldı" />
        <div className="flex flex-col gap-3">
          {weekly.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </div>
      </section>

      {/* Weekly stats */}
      <section>
        <SectionHeader title="Bu hafta kazanılan" />
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Quest" value="1,247" color="teal" />
          <StatTile label="Chat" value="1,247" color="purple" />
          <StatTile label="Streak" value="1,247" color="amber" />
        </div>
      </section>
    </div>
  );
}
