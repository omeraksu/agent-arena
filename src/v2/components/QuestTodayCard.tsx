/**
 * QuestTodayCard — "BUGÜN" section cards (compact variant).
 *
 * Figma: 2 yan yana kart (Quest purple / Chat teal), her biri:
 *   Title / Subtitle / +XP chip (+ optional arrow glyph)
 *
 * accent prop'una göre border-top color kayar.
 * Gap item 11 (compact variant).
 */
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import type { ChipColor } from "../../components/ui";
import type { QuestTemplate } from "../lib/quests";

export interface QuestTodayCardProps {
  quest: QuestTemplate;
  completed?: boolean;
}

const ACCENT_BORDER: Record<ChipColor, string> = {
  teal:   "border-t-arena-teal",
  blue:   "border-t-arena-blue",
  purple: "border-t-arena-purple",
  pink:   "border-t-arena-red",
  amber:  "border-t-arena-amber",
  red:    "border-t-arena-red",
};

const ACCENT_XP: Record<ChipColor, string> = {
  teal:   "text-arena-teal",
  blue:   "text-arena-blue",
  purple: "text-arena-purple",
  pink:   "text-arena-red",
  amber:  "text-arena-amber",
  red:    "text-arena-red",
};

export function QuestTodayCard({ quest, completed = false }: QuestTodayCardProps) {
  return (
    <Link
      to={quest.href}
      className={cn(
        "group relative flex flex-col gap-1.5 p-4",
        "rounded-md border border-arena-text-muted/30 border-t-2",
        "bg-arena-bg-surface hover:bg-arena-bg-elevated",
        "transition-colors duration-200 ease-out",
        ACCENT_BORDER[quest.accent],
        completed && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-[17px] font-semibold text-arena-text-primary leading-tight">
          {quest.title}
        </h3>
        <span
          className={cn("font-mono text-xs leading-none mt-1", ACCENT_XP[quest.accent])}
          aria-hidden
        >
          {quest.icon}
        </span>
      </div>
      <p className="text-[11px] text-arena-text-secondary leading-snug">
        {quest.subtitle}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className={cn("font-mono text-[11px] font-bold", ACCENT_XP[quest.accent])}>
          {completed ? "✓ tamamlandı" : `+${quest.xp} XP`}
        </span>
      </div>
    </Link>
  );
}

QuestTodayCard.displayName = "QuestTodayCard";
