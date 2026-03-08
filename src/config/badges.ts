export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  /** Activity event type that unlocks this badge, or "custom" for computed badges */
  trigger: string;
  /** For custom badges: minimum count required */
  threshold?: number;
}

export const BADGES: Badge[] = [
  {
    id: "ilk_adim",
    name: "Ilk Adim",
    description: "Cuzdanini olusturdu",
    icon: "🚀",
    color: "var(--neon-blue)",
    trigger: "wallet_created",
  },
  {
    id: "faucet_ustasi",
    name: "Faucet Ustasi",
    description: "Test token aldi",
    icon: "💧",
    color: "var(--neon-green)",
    trigger: "faucet",
  },
  {
    id: "transfer_sampiyonu",
    name: "Transfer Sampiyonu",
    description: "Ilk transferini yapti",
    icon: "⚡",
    color: "var(--neon-yellow)",
    trigger: "transfer",
  },
  {
    id: "agent_tamerlani",
    name: "Agent Tamerlani",
    description: "Agent'ini olusturdu",
    icon: "🤖",
    color: "var(--neon-purple)",
    trigger: "agent_registered",
  },
  {
    id: "ikna_ustasi",
    name: "Ikna Ustasi",
    description: "Agent'i ikna edip NFT kazandi",
    icon: "💎",
    color: "var(--neon-yellow)",
    trigger: "nft_mint",
  },
  {
    id: "meme_krali",
    name: "Meme Krali",
    description: "Meme yarismasini kazandi",
    icon: "👑",
    color: "var(--neon-pink)",
    trigger: "meme_winner",
  },
  {
    id: "quiz_virtuozu",
    name: "Quiz Virtuozu",
    description: "Blockchain quiz'ini tamamladi",
    icon: "🧠",
    color: "var(--neon-blue)",
    trigger: "quiz_completed",
  },
  {
    id: "sosyal_kelebek",
    name: "Sosyal Kelebek",
    description: "3+ farkli kisiye transfer yapti",
    icon: "🦋",
    color: "var(--neon-pink)",
    trigger: "custom_unique_transfers",
    threshold: 3,
  },
  {
    id: "signal_master",
    name: "Signal Master",
    description: "Signal Pulse'a 10+ katilim",
    icon: "📡",
    color: "var(--neon-green)",
    trigger: "custom_signal_count",
    threshold: 10,
  },
  {
    id: "master_scout",
    name: "Master Scout",
    description: "3 fragment toplayip hazine avini tamamladi",
    icon: "🗺️",
    color: "var(--neon-yellow)",
    trigger: "treasure_redeemed",
  },
];

export interface BadgeStatus {
  badge: Badge;
  unlocked: boolean;
}

/**
 * Compute which badges are unlocked from a user's activity events.
 */
export function computeBadgeStatuses(
  events: Array<{ type: string; data?: Record<string, string> }>,
): BadgeStatus[] {
  const typeSet = new Set(events.map((e) => e.type));

  // Count unique transfer recipients
  const transferRecipients = new Set<string>();
  let signalCount = 0;
  for (const e of events) {
    if (e.type === "transfer" && e.data?.to) {
      transferRecipients.add(e.data.to.toLowerCase());
    }
    if (e.type === "signal_pulse") {
      signalCount++;
    }
  }

  return BADGES.map((badge) => {
    let unlocked = false;
    if (badge.trigger === "custom_unique_transfers") {
      unlocked = transferRecipients.size >= (badge.threshold || 3);
    } else if (badge.trigger === "custom_signal_count") {
      unlocked = signalCount >= (badge.threshold || 10);
    } else {
      unlocked = typeSet.has(badge.trigger);
    }
    return { badge, unlocked };
  });
}
