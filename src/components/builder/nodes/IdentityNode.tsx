import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface IdentityNodeData {
  name: string;
  onNameChange?: (name: string) => void;
  [key: string]: unknown;
}

function IdentityNodeComponent({ data }: NodeProps) {
  const { name, onNameChange } = data as IdentityNodeData;

  return (
    <div className="builder-node builder-node-identity">
      <Handle type="target" position={Position.Top} className="builder-handle" />

      <div className="px-4 py-3 min-w-[200px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium tracking-wide">
            AGENT_IDENTITY
          </span>
        </div>
        <input
          value={name}
          onChange={(e) =>
            onNameChange?.(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9_]/g, "")
                .slice(0, 16)
            )
          }
          placeholder="AGENT_NAME"
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-emerald-400 font-mono-data text-base tracking-wide outline-none focus:border-emerald-400/50 transition-colors placeholder:text-gray-700"
          maxLength={16}
          onClick={(e) => e.stopPropagation()}
        />
        {name.length > 0 && name.length < 2 && (
          <p className="text-[10px] text-red-400 mt-1">min 2 karakter</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="builder-handle" />
    </div>
  );
}

export const IdentityNode = memo(IdentityNodeComponent);
