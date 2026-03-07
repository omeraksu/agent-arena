import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./_lib/supabase";

// Fallback in-memory store when Supabase is not configured
const inMemoryEvents: Array<{
  id: string;
  type: string;
  address: string;
  data: Record<string, string>;
  created_at: string;
}> = [];

async function getLastResetTime(supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("activity_events")
      .select("created_at")
      .eq("type", "session_reset")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return data?.created_at || null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();

  if (req.method === "GET") {
    // Resolve session boundary once per GET request
    const resetTime = supabase ? await getLastResetTime(supabase) : null;

    // Squad stats endpoint
    if (req.query.stats === "squad") {
      const XP_VALUES: Record<string, number> = {
        wallet_created: 10,
        faucet: 20,
        transfer: 30,
        nft_mint: 200,
        agent_registered: 25,
        quiz_completed: 100,
        meme_submitted: 50,
        meme_voted: 10,
        signal_pulse: 5,
        meme_winner: 300,
      };

      let events: Array<{ type: string; address?: string }> = [];
      if (supabase) {
        let query = supabase
          .from("activity_events")
          .select("type, address")
          .limit(5000);
        if (resetTime) query = query.gt("created_at", resetTime);
        const { data } = await query;
        events = data || [];
      } else {
        events = inMemoryEvents;
      }

      const counts: Record<string, number> = {};
      let totalXP = 0;
      const uniqueAddresses = new Set<string>();
      for (const e of events) {
        counts[e.type] = (counts[e.type] || 0) + 1;
        totalXP += XP_VALUES[e.type] || 0;
        const addr = (e as { address?: string }).address;
        if (addr && addr !== "instructor") uniqueAddresses.add(addr.toLowerCase());
      }

      // Dynamic milestones: scale by participant count
      const p = Math.max(uniqueAddresses.size, 1);
      const milestones = [
        { xp: p * 10,  title: "Ilk Kivilcim",    emoji: "⚡" },
        { xp: p * 50,  title: "Zincir Uyaniyor",  emoji: "🔗" },
        { xp: p * 120, title: "Ag Kuruldu",        emoji: "🌐" },
        { xp: p * 250, title: "Arena Efsanesi",    emoji: "🏆" },
      ];
      const reached = milestones.filter((m) => totalXP >= m.xp);

      return res.status(200).json({ totalXP, counts, milestones: reached, allMilestones: milestones });
    }

    // User progress endpoint
    if (req.query.progress === "true" && req.query.address) {
      const addr = (req.query.address as string).toLowerCase();
      let types: string[] = [];
      if (supabase) {
        let query = supabase
          .from("activity_events")
          .select("type")
          .ilike("address", addr);
        if (resetTime) query = query.gt("created_at", resetTime);
        const { data } = await query;
        types = [...new Set((data || []).map((e: { type: string }) => e.type))];
      } else {
        types = [...new Set(inMemoryEvents.filter((e) => e.address.toLowerCase() === addr).map((e) => e.type))];
      }
      return res.status(200).json({ types });
    }

    // Default: recent activity feed
    if (supabase) {
      let query = supabase
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (resetTime) query = query.gt("created_at", resetTime);
      const { data, error } = await query;

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
