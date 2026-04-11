/**
 * ActivityTimeline — "SON AKTİVİTE" list (Figma MemberHub/Home).
 *
 * Her satır: [accent dot] [title] [+XP · relative time]
 * Gap item 7 (ActivityRow).
 *
 * Faz 2 client-side: `ArenaContext.completedTypes`'tan türetilmiş mock entries.
 * Faz 6'da `getActivity()` API çağrısıyla gerçek verilerle değişecek.
 */
import { EmptyState } from "../../components/ui";
import { cn } from "../../lib/cn";

export interface ActivityEntry {
  id: string;
  title: string;
  xp: number;
  relativeTime: string;
  dotColor: "teal" | "blue" | "purple" | "amber" | "red";
}

export interface ActivityTimelineProps {
  entries: ActivityEntry[];
}

const DOT_CLASSES: Record<ActivityEntry["dotColor"], string> = {
  teal:   "bg-arena-teal",
  blue:   "bg-arena-blue",
  purple: "bg-arena-purple",
  amber:  "bg-arena-amber",
  red:    "bg-arena-red",
};

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  return (
    <li className="flex items-start gap-3 py-3 border-b border-arena-text-muted/15 last:border-0">
      <span
        className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", DOT_CLASSES[entry.dotColor])}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-arena-text-primary leading-tight">{entry.title}</div>
        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-arena-text-tertiary">
          <span>+{entry.xp} XP</span>
          <span aria-hidden>·</span>
          <span>{entry.relativeTime}</span>
        </div>
      </div>
    </li>
  );
}

export function ActivityTimeline({ entries }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Henüz aktivite yok"
        description="İlk quest'ini tamamla, aktiviteler burada birikmeye başlasın."
      />
    );
  }

  return (
    <ul className="flex flex-col">
      {entries.map((entry) => (
        <ActivityRow key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

ActivityTimeline.displayName = "ActivityTimeline";
