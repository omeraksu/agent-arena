import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { IdentityNode } from "./nodes/IdentityNode";
import { ArchetypeNode } from "./nodes/ArchetypeNode";
import { CapabilityNode } from "./nodes/CapabilityNode";
import { NeonEdge } from "./edges/NeonEdge";

const nodeTypes: NodeTypes = {
  identity: IdentityNode,
  archetype: ArchetypeNode,
  capability: CapabilityNode,
};

const edgeTypes: EdgeTypes = {
  neon: NeonEdge,
};

interface BuilderCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}

export default function BuilderCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: BuilderCanvasProps) {
  return (
    <div className="builder-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable={true}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        defaultEdgeOptions={{ type: "neon" }}
        className="builder-reactflow"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.03)"
        />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === "identity") return "#34d399";
            if (n.type === "archetype") return (n.data as { color?: string }).color || "#a78bfa";
            return (n.data as { color?: string }).color || "#60a5fa";
          }}
          nodeColor={(n) => {
            if (n.type === "identity") return "rgba(52, 211, 153, 0.2)";
            if (n.type === "archetype") {
              const c = (n.data as { color?: string }).color || "#a78bfa";
              return `color-mix(in srgb, ${c} 20%, transparent)`;
            }
            const connected = (n.data as { connected?: boolean }).connected;
            return connected ? "rgba(96, 165, 250, 0.2)" : "rgba(100, 100, 100, 0.1)";
          }}
          maskColor="rgba(15, 17, 23, 0.85)"
          style={{
            backgroundColor: "#13151e",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "6px",
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
