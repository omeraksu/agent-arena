import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

// Fallback in-memory store when Supabase is not configured
const inMemoryEvents: Array<{
  id: string;
  type: string;
  address: string;
  data: Record<string, string>;
  created_at: string;
}> = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();

  if (req.method === "GET") {
    if (supabase) {
      const { data, error } = await supabase
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    // In-memory fallback
    return res.status(200).json(inMemoryEvents.slice(-20).reverse());
  }

  if (req.method === "POST") {
    const { type, address, data } = req.body;
    if (!type || !address) {
      return res.status(400).json({ error: "type ve address gerekli" });
    }

    const event = {
      id: crypto.randomUUID(),
      type,
      address,
      data: data || {},
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { error } = await supabase.from("activity_events").insert(event);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      inMemoryEvents.push(event);
      // Keep max 100 events in memory
      if (inMemoryEvents.length > 100) inMemoryEvents.shift();
    }

    return res.status(201).json(event);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
