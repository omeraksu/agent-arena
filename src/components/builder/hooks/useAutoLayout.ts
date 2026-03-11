import { useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import dagre from "dagre";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

/**
 * Auto-layout nodes using dagre (top-to-bottom directed graph).
 * Identity stays at top, archetype below, capabilities fan out at bottom.
 */
export function useAutoLayout() {
  const getLayoutedElements = useCallback(
    (nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } => {
      if (nodes.length === 0) return { nodes, edges };

      const g = new dagre.graphlib.Graph();
      g.setDefaultEdgeLabel(() => ({}));
      g.setGraph({
        rankdir: "TB",
        nodesep: 60,
        ranksep: 100,
        marginx: 40,
        marginy: 40,
      });

      nodes.forEach((node) => {
        const w = node.type === "identity" ? 220 : NODE_WIDTH;
        const h = node.type === "identity" ? 100 : NODE_HEIGHT;
        g.setNode(node.id, { width: w, height: h });
      });

      edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
      });

      dagre.layout(g);

      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        if (!nodeWithPosition) return node;
        const w = node.type === "identity" ? 220 : NODE_WIDTH;
        const h = node.type === "identity" ? 100 : NODE_HEIGHT;
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - w / 2,
            y: nodeWithPosition.y - h / 2,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    },
    []
  );

  return { getLayoutedElements };
}
