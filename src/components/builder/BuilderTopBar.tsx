import type { BuilderMode } from "./hooks/useBuilderState";

interface BuilderTopBarProps {
  mode: BuilderMode;
  onModeChange: (mode: BuilderMode) => void;
  onCompile: () => void;
  canCompile: boolean;
  agentName: string;
  connectedArchetypeId: string | null;
  enabledChipCount: number;
}

export default function BuilderTopBar({
  mode,
  onModeChange,
  onCompile,
  canCompile,
  agentName,
  connectedArchetypeId,
  enabledChipCount,
}: BuilderTopBarProps) {
  return (
    <div className="builder-topbar">
      <div className="flex items-center gap-3">
        <span className="font-medium text-sm text-gray-300">
          Agent Builder
        </span>

        {/* Status indicators */}
        <div className="hidden sm:flex items-center gap-2 ml-2">
          <StatusPill
            label="İsim"
            ok={agentName.length >= 2}
            color="#34d399"
          />
          <StatusPill
            label="Kişilik"
            ok={!!connectedArchetypeId}
            color="#a78bfa"
          />
          <StatusPill
            label={`Yetenek: ${enabledChipCount}`}
            ok={enabledChipCount > 0}
            color="#60a5fa"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Mode toggle */}
        <div className="flex border border-white/10 rounded-md overflow-hidden">
          <button
            onClick={() => onModeChange("simple")}
            className={`text-[11px] font-medium px-3 py-1.5 transition-all ${
              mode === "simple"
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Basit
          </button>
          <button
            onClick={() => onModeChange("advanced")}
            className={`text-[11px] font-medium px-3 py-1.5 transition-all ${
              mode === "advanced"
                ? "bg-violet-500/10 text-violet-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Gelişmiş
          </button>
        </div>

        {/* Compile button */}
        <button
          onClick={onCompile}
          disabled={!canCompile}
          className="rounded-md bg-emerald-500 hover:bg-emerald-400 px-4 py-1.5 text-[11px] font-semibold text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Derle
        </button>
      </div>
    </div>
  );
}

function StatusPill({ label, ok, color }: { label: string; ok: boolean; color: string }) {
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all"
      style={{
        borderColor: ok ? `color-mix(in srgb, ${color} 30%, transparent)` : "rgba(255,255,255,0.06)",
        color: ok ? color : "#6b7280",
        backgroundColor: ok ? `color-mix(in srgb, ${color} 8%, transparent)` : "transparent",
      }}
    >
      {ok ? "✓" : "○"} {label}
    </span>
  );
}
