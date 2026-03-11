import { useState, useCallback, useMemo, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ARCHETYPES, CAPABILITY_CHIPS, type MadLibsPersonality } from "@/config/archetypes";
import { useBuilderState } from "./hooks/useBuilderState";
import BuilderCanvas from "./BuilderCanvas";
import BuilderPalette from "./BuilderPalette";
import BuilderTopBar from "./BuilderTopBar";
import CompileAnimation from "./CompileAnimation";

const MIN_PALETTE_W = 52;
const MAX_PALETTE_W = 400;
const DEFAULT_PALETTE_W = 180;

interface AgentBuilderProps {
  onComplete: (config: {
    name: string;
    personality: MadLibsPersonality;
    enabledChips: string[];
    derivedArchetypeId: string;
  }) => void;
}

function AgentBuilderInner({ onComplete }: AgentBuilderProps) {
  const {
    nodes,
    edges,
    mode,
    setMode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setAgentName,
    getAgentName,
    connectArchetype,
    toggleCapability,
    compile,
    getConnectedArchetypeId,
  } = useBuilderState();

  // ─── Resizable palette ───
  const [paletteWidth, setPaletteWidth] = useState(DEFAULT_PALETTE_W);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(DEFAULT_PALETTE_W);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startW.current = paletteWidth;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - startX.current;
      setPaletteWidth(Math.min(MAX_PALETTE_W, Math.max(MIN_PALETTE_W, startW.current + delta)));
    };
    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [paletteWidth]);

  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledConfig, setCompiledConfig] = useState<{
    name: string;
    personality: MadLibsPersonality;
    enabledChips: string[];
    derivedArchetypeId: string;
  } | null>(null);

  // Inject callbacks into node data
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map((node) => {
      if (node.type === "identity") {
        return {
          ...node,
          data: { ...node.data, onNameChange: setAgentName },
        };
      }
      if (node.type === "capability") {
        return {
          ...node,
          data: { ...node.data, onToggle: toggleCapability },
        };
      }
      return node;
    });
  }, [nodes, setAgentName, toggleCapability]);

  const connectedArchetypeId = getConnectedArchetypeId();
  const agentName = getAgentName();

  // Count connected capabilities
  const connectedChipIds = useMemo(() => {
    return nodes
      .filter((n) => n.type === "capability" && (n.data as { connected?: boolean }).connected)
      .map((n) => (n.data as { chipId: string }).chipId);
  }, [nodes]);

  const canCompile = agentName.length >= 2 && !!connectedArchetypeId;

  const handleCompile = useCallback(() => {
    const config = compile();
    if (!config) return;

    setCompiledConfig({
      name: config.name,
      personality: config.personality,
      enabledChips: config.enabledChips,
      derivedArchetypeId: config.derivedArchetypeId || "hacker",
    });
    setIsCompiling(true);
  }, [compile]);

  const handleCompileComplete = useCallback(() => {
    if (compiledConfig) {
      onComplete(compiledConfig);
    }
  }, [compiledConfig, onComplete]);

  return (
    <div className="builder-container">
      <BuilderTopBar
        mode={mode}
        onModeChange={setMode}
        onCompile={handleCompile}
        canCompile={canCompile}
        agentName={agentName}
        connectedArchetypeId={connectedArchetypeId}
        enabledChipCount={connectedChipIds.length}
      />

      <div className="builder-body">
        <div style={{ width: paletteWidth, flexShrink: 0 }}>
          <BuilderPalette
            onArchetypeSelect={connectArchetype}
            onCapabilityToggle={toggleCapability}
            connectedArchetypeId={connectedArchetypeId}
            connectedChipIds={connectedChipIds}
          />
        </div>

        {/* Resize handle */}
        <div
          className="builder-resize-handle"
          onMouseDown={onResizeStart}
        />

        <BuilderCanvas
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        />
      </div>

      {isCompiling && compiledConfig && (
        <CompileAnimation
          agentName={compiledConfig.name}
          archetypeId={compiledConfig.derivedArchetypeId}
          personality={compiledConfig.personality}
          enabledChipCount={compiledConfig.enabledChips.length}
          totalChipCount={CAPABILITY_CHIPS.length}
          onComplete={handleCompileComplete}
        />
      )}
    </div>
  );
}

export default function AgentBuilder({ onComplete }: AgentBuilderProps) {
  return (
    <ReactFlowProvider>
      <AgentBuilderInner onComplete={onComplete} />
    </ReactFlowProvider>
  );
}
