import { useState, useCallback } from "react";
import {
  type Node,
  type Edge,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { ARCHETYPES } from "@/config/archetypes";
import {
  createIdentityNode,
  createDefaultCapabilityNodes,
  getArchetypePersonalityDefaults,
} from "../utils/nodeDefaults";
import { compileConfig } from "../utils/compileConfig";
import { useAutoLayout } from "./useAutoLayout";

export type BuilderMode = "simple" | "advanced";

export function useBuilderState() {
  const [mode, setMode] = useState<BuilderMode>("simple");

  // Initialize with identity node + default capabilities
  const identityNode = createIdentityNode();
  const { nodes: capNodes, edges: capEdges } = createDefaultCapabilityNodes();

  const [nodes, setNodes] = useState<Node[]>([identityNode, ...capNodes]);
  const [edges, setEdges] = useState<Edge[]>(capEdges);

  const { getLayoutedElements } = useAutoLayout();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // Don't allow manual connections in simple mode
      if (mode === "simple") return;
      const newEdge: Edge = {
        id: `e-${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        type: "neon",
      };
      setEdges((eds) => [...eds, newEdge]);
    },
    [mode]
  );

  /** Update agent name on the identity node */
  const setAgentName = useCallback((name: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === "identity-0" ? { ...n, data: { ...n.data, name } } : n
      )
    );
  }, []);

  /** Get current agent name */
  const getAgentName = useCallback((): string => {
    const identityNode = nodes.find((n) => n.id === "identity-0");
    return (identityNode?.data as { name?: string })?.name || "";
  }, [nodes]);

  /** Connect an archetype to identity (only one at a time) */
  const connectArchetype = useCallback(
    (archetypeId: string) => {
      const archetype = ARCHETYPES.find((a) => a.id === archetypeId);
      if (!archetype) return;

      const personalityDefaults = getArchetypePersonalityDefaults(archetypeId);

      setNodes((nds) => {
        // Remove any existing archetype node
        const filtered = nds.filter((n) => n.type !== "archetype");

        // Create new archetype node
        const newNode: Node = {
          id: `arch-${archetypeId}`,
          type: "archetype",
          position: { x: 0, y: -160 },
          data: {
            archetypeId,
            label: archetype.name,
            tag: archetype.tag,
            color: archetype.color,
            glowClass: archetype.glowClass,
            description: archetype.description,
            connected: true,
            ...personalityDefaults,
          },
        };

        return [...filtered, newNode];
      });

      // Update edges: remove old archetype edge, add new one
      setEdges((eds) => {
        const filtered = eds.filter(
          (e) => !e.id.startsWith("e-arch-") && !e.id.startsWith("e-identity-0-arch-")
        );
        return [
          ...filtered,
          {
            id: `e-arch-${archetypeId}-identity`,
            source: `arch-${archetypeId}`,
            target: "identity-0",
            type: "neon",
            data: { color: archetype.color },
          },
        ];
      });

      // Auto-layout after archetype connection
      setTimeout(() => {
        setNodes((nds) => {
          setEdges((eds) => {
            const { nodes: ln, edges: le } = getLayoutedElements(nds, eds);
            // We need to set edges from within a callback chain
            // Use a workaround: update edges in the next tick
            setTimeout(() => setEdges(le), 0);
            return eds;
          });
          return nds;
        });
      }, 50);
    },
    [getLayoutedElements]
  );

  /** Toggle a capability chip connection */
  const toggleCapability = useCallback((chipId: string) => {
    const nodeId = `cap-${chipId}`;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== nodeId) return n;
        const wasConnected = (n.data as { connected?: boolean }).connected;
        return { ...n, data: { ...n.data, connected: !wasConnected } };
      })
    );

    setEdges((eds) => {
      const edgeId = `e-identity-${nodeId}`;
      const exists = eds.some((e) => e.id === edgeId);
      if (exists) {
        return eds.filter((e) => e.id !== edgeId);
      } else {
        const node = nodes.find((n) => n.id === nodeId);
        const color = node ? (node.data as { color?: string }).color : "var(--neon-green)";
        return [
          ...eds,
          {
            id: edgeId,
            source: "identity-0",
            target: nodeId,
            type: "neon",
            data: { color },
          },
        ];
      }
    });
  }, [nodes]);

  /** Run auto-layout */
  const autoLayout = useCallback(() => {
    const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges);
    setNodes(ln);
    setEdges(le);
  }, [nodes, edges, getLayoutedElements]);

  /** Compile current state into AgentConfig */
  const compile = useCallback(() => {
    return compileConfig(nodes);
  }, [nodes]);

  /** Get connected archetype id */
  const getConnectedArchetypeId = useCallback((): string | null => {
    const archNode = nodes.find(
      (n) => n.type === "archetype" && (n.data as { connected?: boolean }).connected
    );
    return archNode ? (archNode.data as { archetypeId: string }).archetypeId : null;
  }, [nodes]);

  return {
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
    autoLayout,
    compile,
    getConnectedArchetypeId,
    setNodes,
    setEdges,
  };
}
