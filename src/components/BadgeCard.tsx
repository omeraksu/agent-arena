import type { BadgeStatus } from "@/config/badges";

export default function BadgeCard({ badge, unlocked }: BadgeStatus) {
  return (
    <div
      className={`cyber-card p-3 text-center transition-all ${
        unlocked ? "hover:scale-105" : "opacity-30 grayscale"
      }`}
      style={{
        borderColor: unlocked
          ? `color-mix(in srgb, ${badge.color} 40%, transparent)`
          : undefined,
      }}
    >
      <div className="text-2xl mb-1">{unlocked ? badge.icon : "🔒"}</div>
      <p
        className="font-mono-data text-[10px] font-bold tracking-wider"
        style={{ color: unlocked ? badge.color : "var(--text-dim)" }}
      >
        {badge.name.toUpperCase()}
      </p>
      <p className="font-mono-data text-[8px] text-gray-600 mt-0.5 leading-tight">
        {badge.description}
      </p>
    </div>
  );
}
