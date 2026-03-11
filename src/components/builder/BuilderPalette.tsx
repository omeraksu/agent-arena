import { createArchetypePaletteItems, createCapabilityPaletteItems } from "./utils/nodeDefaults";

interface BuilderPaletteProps {
  onArchetypeSelect: (archetypeId: string) => void;
  onCapabilityToggle: (chipId: string) => void;
  connectedArchetypeId: string | null;
  connectedChipIds: string[];
}

export default function BuilderPalette({
  onArchetypeSelect,
  onCapabilityToggle,
  connectedArchetypeId,
  connectedChipIds,
}: BuilderPaletteProps) {
  const archetypes = createArchetypePaletteItems();
  const capabilities = createCapabilityPaletteItems();

  return (
    <div className="builder-palette custom-scrollbar">
      {/* Archetype section */}
      <div className="mb-4">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
          Kişilik
        </p>
        <div className="space-y-1">
          {archetypes.map((arch) => {
            const isConnected = connectedArchetypeId === arch.archetypeId;
            return (
              <button
                key={arch.archetypeId}
                onClick={() => onArchetypeSelect(arch.archetypeId)}
                className="w-full text-left px-2.5 py-2 rounded-md transition-all hover:bg-white/5"
                style={{
                  backgroundColor: isConnected
                    ? `color-mix(in srgb, ${arch.color} 10%, transparent)`
                    : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-0.5 h-5 rounded-full transition-colors"
                    style={{
                      backgroundColor: isConnected ? arch.color : "transparent",
                    }}
                  />
                  <span className="text-base">{arch.icon}</span>
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-semibold truncate"
                      style={{ color: isConnected ? arch.color : "#9ca3af" }}
                    >
                      {arch.label}
                    </p>
                    <p className="font-mono-data text-[9px] text-gray-600">{arch.tag}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-white/6 my-3 mx-2" />

      {/* Capability section */}
      <div>
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
          Yetenek
        </p>
        <div className="space-y-1">
          {capabilities.map((cap) => {
            const isConnected = connectedChipIds.includes(cap.chipId);
            return (
              <button
                key={cap.chipId}
                onClick={() => onCapabilityToggle(cap.chipId)}
                className={`w-full text-left px-2.5 py-2 rounded-md transition-all hover:bg-white/5 ${
                  isConnected ? "" : "opacity-50 hover:opacity-70"
                }`}
                style={{
                  backgroundColor: isConnected
                    ? `color-mix(in srgb, ${cap.color} 8%, transparent)`
                    : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-0.5 h-5 rounded-full transition-colors"
                    style={{
                      backgroundColor: isConnected ? cap.color : "transparent",
                    }}
                  />
                  <span className="text-sm">{cap.icon}</span>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: isConnected ? cap.color : "#6b7280" }}
                  >
                    {cap.label}
                  </span>
                  <span
                    className="ml-auto text-[10px] font-medium"
                    style={{ color: isConnected ? cap.color : "#4b5563" }}
                  >
                    {isConnected ? "ON" : "OFF"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
