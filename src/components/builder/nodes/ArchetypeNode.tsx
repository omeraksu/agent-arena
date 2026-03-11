import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { getArchetypeIcon } from "../utils/nodeDefaults";

interface ArchetypeNodeData {
  archetypeId: string;
  label: string;
  tag: string;
  color: string;
  glowClass: string;
  description: string;
  connected: boolean;
  [key: string]: unknown;
}

function ArchetypeNodeComponent({ data }: NodeProps) {
  const { archetypeId, label, tag, color, connected } = data as ArchetypeNodeData;
  const icon = getArchetypeIcon(archetypeId);

  return (
    <div
      className={`builder-node builder-node-archetype ${connected ? "builder-node-connected" : ""}`}
      style={{
        borderColor: connected ? `color-mix(in srgb, ${color} 40%, transparent)` : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} className="builder-handle" style={{ visibility: "hidden" }} />

      <div className="px-3 py-2.5 min-w-[160px]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <p
              className="text-xs font-semibold"
              style={{ color: connected ? color : "#9ca3af" }}
            >
              {label}
            </p>
            <p className="font-mono-data text-[9px] text-gray-600">{tag}</p>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="builder-handle" />
    </div>
  );
}

export const ArchetypeNode = memo(ArchetypeNodeComponent);
