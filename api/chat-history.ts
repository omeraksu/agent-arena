import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

// In-memory fallback
const sessions = new Map<string, { archetype: string; sliders: object; messages: object[] }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  const sessionId = (req.query.id as string) || "";

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId gerekli" });
  }

  // GET — load session
  if (req.method === "GET") {
    if (supabase) {
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      return res.status(200).json(data || null);
    }
    return res.status(200).json(sessions.get(sessionId) || null);
  }

  // POST — save session
  if (req.method === "POST") {
    const { archetype, sliders, messages } = req.body;
    // Keep only last 10 messages
    const trimmed = (messages || []).slice(-10);

    if (supabase) {
      const { error } = await supabase
        .from("chat_sessions")
        .upsert({
          id: sessionId,
          archetype,
          sliders,
          messages: trimmed,
          updated_at: new Date().toISOString(),
        });
      if (error) return res.status(500).json({ error: error.message });
    } else {
      sessions.set(sessionId, { archetype, sliders, messages: trimmed });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
