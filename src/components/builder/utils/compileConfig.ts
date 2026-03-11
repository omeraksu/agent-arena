import type { Node } from "@xyflow/react";
import { deriveArchetypeFromPersonality, type MadLibsPersonality } from "@/config/archetypes";

interface AgentConfig {
  version: 2;
  name: string;
  personality: MadLibsPersonality;
  enabledChips: string[];
  derivedArchetypeId?: string;
}

/**
 * Compile canvas nodes into an AgentConfig object.
 * Reads identity node for name, archetype node for personality derivation,
 * and connected capability nodes for enabled chips.
 */
export function compileConfig(nodes: Node[]): AgentConfig | null {
  // Find identity node
  const identityNode = nodes.find((n) => n.type === "identity");
  if (!identityNode) return null;

  const agentName = (identityNode.data as { name?: string }).name || "";
  if (agentName.length < 2) return null;

  // Find connected archetype node
  const archetypeNode = nodes.find((n) => n.type === "archetype" && (n.data as { connected?: boolean }).connected);
  const archetypeId = archetypeNode ? (archetypeNode.data as { archetypeId?: string }).archetypeId : undefined;

  // Build personality from archetype suggestions
  const personality: MadLibsPersonality = {
    speechStyle: archetypeNode ? (archetypeNode.data as { speechStyle?: string }).speechStyle || "" : "",
    curiosity: archetypeNode ? (archetypeNode.data as { curiosity?: string }).curiosity || "" : "",
    vibe: archetypeNode ? (archetypeNode.data as { vibe?: string }).vibe || "" : "",
    freeText: "",
  };

  // Find connected capability nodes
  const capabilityNodes = nodes.filter(
    (n) => n.type === "capability" && (n.data as { connected?: boolean }).connected
  );
  const enabledChips = capabilityNodes.map((n) => (n.data as { chipId: string }).chipId);

  // Derive archetype from personality or use direct selection
  const derivedArchetypeId = archetypeId || deriveArchetypeFromPersonality(personality);

  return {
    version: 2,
    name: agentName,
    personality,
    enabledChips,
    derivedArchetypeId,
  };
}
