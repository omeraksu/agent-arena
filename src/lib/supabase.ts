import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

// ─── Agent Presence ───

export interface AgentPresence {
  agent_name: string;
  archetype: string;
  online_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let presenceChannel: any = null;

export function getPresenceChannel() {
  if (!supabase) return null;
  if (!presenceChannel) {
    presenceChannel = supabase.channel("agent-presence", {
      config: { presence: { key: "agent_name" } },
    });
  }
  return presenceChannel;
}

export function trackPresence(agentName: string, archetype: string) {
  const channel = getPresenceChannel();
  if (!channel) return;
  channel.subscribe((status: string) => {
    if (status === "SUBSCRIBED") {
      channel.track({
        agent_name: agentName,
        archetype,
        online_at: new Date().toISOString(),
      });
    }
  });
}

export function untrackPresence() {
  if (presenceChannel) {
    presenceChannel.untrack();
  }
}
