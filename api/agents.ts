/**
 * Agent Registry + Messaging Endpoint
 *
 * GET /api/agents — tüm kayıtlı agentları listele
 * POST /api/agents — agent kaydet/güncelle veya mesaj gönder
 * GET /api/agents?messages=AGENTNAME — agent'a gelen mesajları getir
 *
 * Supabase varsa kullanır, hata olursa (tablo yok vs.) in-memory fallback.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabase() {
  const url =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── In-Memory Stores ──────────────────────────────────────────────────

interface AgentRecord {
  session_id: string;
  agent_name: string;
  archetype: string;
  sliders: object;
  owner_address: string;
  owner_name: string | null;
  last_seen: string;
}

interface AgentMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  message: string;
  intent: string;
  is_read: boolean;
  created_at: string;
}

const agentRegistry = new Map<string, AgentRecord>();
const agentMessages: AgentMessage[] = [];
const MAX_MESSAGES = 200;

// ─── Supabase helpers with fallback ────────────────────────────────────

async function getAgentsFromDB(supabase: SupabaseClient): Promise<AgentRecord[] | null> {
  try {
    const { data, error } = await supabase
      .from("agent_registry")
      .select("*")
      .order("last_seen", { ascending: false });
    if (error) return null;
    return data || [];
  } catch {
    return null;
  }
}

async function upsertAgentDB(supabase: SupabaseClient, record: AgentRecord): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("agent_registry")
      .upsert(record, { onConflict: "agent_name" });
    return !error;
  } catch {
    return false;
  }
}

async function getMessagesFromDB(supabase: SupabaseClient, agentName: string): Promise<AgentMessage[] | null> {
  try {
    const { data, error } = await supabase
      .from("agent_messages")
      .select("*")
      .eq("to_agent", agentName)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return null;
    return data || [];
  } catch {
    return null;
  }
}

async function insertMessageDB(supabase: SupabaseClient, msg: AgentMessage): Promise<boolean> {
  try {
    const { error } = await supabase.from("agent_messages").insert(msg);
    return !error;
  } catch {
    return false;
  }
}

// ─── Handler ───────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();

  // ─── GET: List agents or get messages ──────────────────────────────
  if (req.method === "GET") {
    const messagesFor = req.query.messages as string | undefined;

    // Get messages for a specific agent
    if (messagesFor) {
      if (supabase) {
        const dbMessages = await getMessagesFromDB(supabase, messagesFor);
        if (dbMessages !== null) {
          return res.status(200).json({ messages: dbMessages });
        }
      }
      // In-memory fallback
      const msgs = agentMessages
        .filter((m) => m.to_agent.toLowerCase() === messagesFor.toLowerCase())
        .slice(-20)
        .reverse();
      return res.status(200).json({ messages: msgs });
    }

    // List all agents
    if (supabase) {
      const dbAgents = await getAgentsFromDB(supabase);
      if (dbAgents !== null) {
        return res.status(200).json({ agents: dbAgents });
      }
    }
    // In-memory fallback
    const agents = Array.from(agentRegistry.values()).sort(
      (a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
    );
    return res.status(200).json({ agents });
  }

  // ─── POST: Register agent or send message ──────────────────────────
  if (req.method === "POST") {
    const { action } = req.body;

    // Send message to another agent
    if (action === "message") {
      const { from_agent, to_agent, message, intent } = req.body;
      if (!from_agent || !to_agent || !message) {
        return res.status(400).json({ error: "from_agent, to_agent, message gerekli" });
      }

      const msg: AgentMessage = {
        id: crypto.randomUUID(),
        from_agent,
        to_agent,
        message,
        intent: intent || "general",
        is_read: false,
        created_at: new Date().toISOString(),
      };

      let saved = false;
      if (supabase) {
        saved = await insertMessageDB(supabase, msg);
      }
      if (!saved) {
        // In-memory fallback
        agentMessages.push(msg);
        if (agentMessages.length > MAX_MESSAGES) agentMessages.shift();
      }

      return res.status(200).json({ ok: true, message: msg });
    }

    // Register or update agent
    const { session_id, agent_name, archetype, sliders, owner_address, owner_name } = req.body;
    if (!agent_name || !owner_address) {
      return res.status(400).json({ error: "agent_name ve owner_address gerekli" });
    }

    const record: AgentRecord = {
      session_id: session_id || crypto.randomUUID(),
      agent_name,
      archetype: archetype || "hacker",
      sliders: sliders || {},
      owner_address,
      owner_name: owner_name || null,
      last_seen: new Date().toISOString(),
    };

    let saved = false;
    if (supabase) {
      saved = await upsertAgentDB(supabase, record);
    }
    if (!saved) {
      // In-memory fallback
      agentRegistry.set(agent_name.toLowerCase(), record);
    }

    // Post activity (best-effort)
    try {
      const proto = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "";
      await fetch(`${proto}://${host}/api/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "agent_registered",
          address: owner_address,
          data: {
            agentName: agent_name,
            archetype: archetype || "hacker",
            ownerName: owner_name || "",
          },
        }),
      });
    } catch {
      // best-effort
    }

    return res.status(200).json({ ok: true, agent: record });
  }

  // ─── DELETE: Reset all agents and messages ──────────────────────────
  if (req.method === "DELETE") {
    if (supabase) {
      await supabase.from("agent_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("agent_registry").delete().neq("agent_name", "");
    }
    agentRegistry.clear();
    agentMessages.length = 0;
    return res.status(200).json({ ok: true, message: "Tüm agentlar ve mesajlar silindi" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
