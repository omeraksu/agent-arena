import type { BadgeStatus } from "@/config/badges";
import BadgeCard from "./BadgeCard";

interface Props {
  statuses: BadgeStatus[];
}

export default function BadgeGrid({ statuses }: Props) {
  const unlocked = statuses.filter((s) => s.unlocked).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-yellow)]" />
        <h2 className="font-mono-data text-sm font-bold text-[var(--neon-yellow)]">
          BADGES [{unlocked}/{statuses.length}]
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {statuses.map((s) => (
          <BadgeCard key={s.badge.id} badge={s.badge} unlocked={s.unlocked} />
        ))}
      </div>
    </div>
  );
}
