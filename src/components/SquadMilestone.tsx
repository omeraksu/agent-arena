import { useEffect, useState } from "react";
import { getSquadStats, type SquadStats } from "@/lib/api";
import { SQUAD_POLL_INTERVAL } from "@/config/constants";

export default function SquadMilestone() {
  const [stats, setStats] = useState<SquadStats | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const data = await getSquadStats();
        if (active) setStats(data);
      } catch { /* ignore */ }
    }
    poll();
    const interval = setInterval(poll, SQUAD_POLL_INTERVAL);
    return () => { active = false; clearInterval(interval); };
  }, []);

  if (!stats || !stats.allMilestones?.length) return null;

  const { totalXP, allMilestones } = stats;
  const lastMilestone = allMilestones.filter((m) => totalXP >= m.xp);
  const nextMilestone = allMilestones.find((m) => totalXP < m.xp) || allMilestones[allMilestones.length - 1];
  const prevXP = lastMilestone.length > 0 ? lastMilestone[lastMilestone.length - 1].xp : 0;
  const progress = nextMilestone.xp === prevXP
    ? 100
    : Math.min(100, ((totalXP - prevXP) / (nextMilestone.xp - prevXP)) * 100);

  return (
    <div className="px-3 py-2 border-b border-green-900/20">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono-data text-[9px] text-[var(--neon-purple)] font-bold tracking-wider">
          SQUAD_XP
        </span>
        <span className="font-mono-data text-[9px] text-gray-500">
          {totalXP} / {nextMilestone.xp}
        </span>
      </div>

      {/* Progress bar with milestone markers */}
      <div className="relative h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: totalXP >= allMilestones[3]?.xp
              ? "linear-gradient(90deg, #f0f, #0ff)"
              : totalXP >= allMilestones[2]?.xp
                ? "linear-gradient(90deg, #0ff, #0f0)"
                : "linear-gradient(90deg, var(--neon-purple), var(--neon-blue))",
          }}
        />
        {/* Milestone markers on the full bar */}
        {allMilestones.map((m) => {
          const maxXP = allMilestones[allMilestones.length - 1].xp;
          const pos = (m.xp / maxXP) * 100;
          const reached = totalXP >= m.xp;
          return (
            <div
              key={m.xp}
              className="absolute top-0 h-full w-px"
              style={{ left: `${pos}%`, backgroundColor: reached ? "#fff" : "rgba(255,255,255,0.15)" }}
              title={m.title}
            />
          );
        })}
      </div>

      {/* Milestone labels */}
      <div className="flex gap-1 mt-1 flex-wrap">
        {allMilestones.map((m) => {
          const reached = totalXP >= m.xp;
          return (
            <span
              key={m.xp}
              className={`font-mono-data text-[8px] px-1 rounded ${
                reached
                  ? "text-[var(--neon-green)] bg-[rgba(0,255,170,0.1)]"
                  : "text-gray-700"
              }`}
            >
              {m.emoji} {m.title}
            </span>
          );
        })}
      </div>
    </div>
  );
}
