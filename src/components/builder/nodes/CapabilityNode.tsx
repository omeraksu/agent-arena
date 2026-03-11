import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface CapabilityNodeData {
  chipId: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  connected: boolean;
  onToggle?: (chipId: string) => void;
  [key: string]: unknown;
}

function CapabilityNodeComponent({ data }: NodeProps) {
  const { chipId, label, icon, color, description, connected, onToggle } = data as CapabilityNodeData;

  return (
    <div
      className={`builder-node builder-node-capability ${connected ? "builder-node-connected" : "builder-node-dim"}`}
      style={{
        borderColor: connected ? `color-mix(in srgb, ${color} 30%, transparent)` : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.(chipId);
      }}
    >
      <Handle type="target" position={Position.Top} className="builder-handle" />

      <div className="px-3 py-2 min-w-[130px]">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span
            className="text-[10px] font-semibold"
            style={{ color: connected ? color : "#6b7280" }}
          >
            {label}
          </span>
          <span
            className="ml-auto w-2 h-2 rounded-full"
            style={{
              backgroundColor: connected ? color : "transparent",
              border: connected ? "none" : "1.5px solid #4b5563",
            }}
          />
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export const CapabilityNode = memo(CapabilityNodeComponent);
