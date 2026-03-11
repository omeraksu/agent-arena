import type { Node, Edge } from "@xyflow/react";
import { ARCHETYPES, CAPABILITY_CHIPS, getDefaultEnabledChips } from "@/config/archetypes";

const IDENTITY_ID = "identity-0";

/** Create the fixed identity node at center */
export function createIdentityNode(): Node {
  return {
    id: IDENTITY_ID,
    type: "identity",
    position: { x: 0, y: 0 },
    data: { name: "" },
    deletable: false,
    draggable: true,
  };
}

/** Create palette archetype nodes (not yet on canvas) */
export function createArchetypePaletteItems() {
  return ARCHETYPES.map((arch) => ({
    nodeType: "archetype" as const,
    archetypeId: arch.id,
    label: arch.name,
    tag: arch.tag,
    color: arch.color,
    glowClass: arch.glowClass,
    description: arch.description,
    icon: getArchetypeIcon(arch.id),
  }));
}

/** Create palette capability items */
export function createCapabilityPaletteItems() {
  return CAPABILITY_CHIPS.map((chip) => ({
    nodeType: "capability" as const,
    chipId: chip.id,
    label: chip.label,
    icon: chip.icon,
    color: chip.color,
    description: chip.description,
  }));
}

/** Create default capability nodes (pre-connected) */
export function createDefaultCapabilityNodes(): { nodes: Node[]; edges: Edge[] } {
  const defaultChips = getDefaultEnabledChips();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  CAPABILITY_CHIPS.forEach((chip, i) => {
    const isDefault = defaultChips.includes(chip.id);
    const nodeId = `cap-${chip.id}`;
    // Position capabilities in a semi-circle below identity
    const angle = ((i - (CAPABILITY_CHIPS.length - 1) / 2) * Math.PI) / (CAPABILITY_CHIPS.length + 2);
    const radius = 220;
    nodes.push({
      id: nodeId,
      type: "capability",
      position: {
        x: Math.sin(angle) * radius,
        y: Math.cos(angle) * radius + 80,
      },
      data: {
        chipId: chip.id,
        label: chip.label,
        icon: chip.icon,
        color: chip.color,
        description: chip.description,
        connected: isDefault,
      },
    });

    if (isDefault) {
      edges.push({
        id: `e-identity-${nodeId}`,
        source: IDENTITY_ID,
        target: nodeId,
        type: "neon",
        data: { color: chip.color },
      });
    }
  });

  return { nodes, edges };
}

export function getArchetypeIcon(id: string): string {
  switch (id) {
    case "hacker": return "🔓";
    case "sage": return "🔮";
    case "pirate": return "🏴‍☠️";
    case "scientist": return "🧪";
    case "glitch": return "⚡";
    case "architect": return "🏗️";
    default: return "🤖";
  }
}

/** Default personality values per archetype */
export function getArchetypePersonalityDefaults(archetypeId: string) {
  switch (archetypeId) {
    case "hacker":
      return { speechStyle: "hacker gibi", curiosity: "hackleme ve kodlama", vibe: "gizemli ve sıradışı" };
    case "sage":
      return { speechStyle: "bilge bir usta gibi", curiosity: "felsefe ve sahiplik", vibe: "sakin ve düşünceli" };
    case "pirate":
      return { speechStyle: "korsan gibi", curiosity: "hazine avı ve macera", vibe: "enerjik ve heyecanlı" };
    case "scientist":
      return { speechStyle: "bilim insanı gibi", curiosity: "deneyler ve veriler", vibe: "keskin ve meydan okuyan" };
    case "glitch":
      return { speechStyle: "bozuk robot gibi", curiosity: "blockchain ve NFT", vibe: "gizemli ve sıradışı" };
    case "architect":
      return { speechStyle: "arkadaşın gibi", curiosity: "blockchain ve NFT", vibe: "sakin ve düşünceli" };
    default:
      return { speechStyle: "", curiosity: "", vibe: "" };
  }
}
