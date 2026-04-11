/**
 * Treasure Hunt (Fragment Hunt) Endpoint
 *
 * GET  /api/treasure?address=0x...           — collected fragments for user
 * POST /api/treasure { action: "generate" }  — instructor generates fragments
 * POST /api/treasure { action: "collect" }   — collect a fragment from agent
 * POST /api/treasure { action: "redeem" }    — redeem 3 fragments for badge
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_lib/supabase.js";
import { isValidAddress, safePasswordCompare } from "./_lib/validation.js";

const FRAGMENTS_NEEDED = 3;
const INSTRUCTOR_PASSWORD = process.env.INSTRUCTOR_PASSWORD;

// In-memory fallback
interface Fragment {
  id: string;
  owner_agent: string;
  owner_address: string;
  archetype: string;
  fragment_code: string;
  collected_by: string | null;
  collected_at: string | null;
  redeemed: boolean;
}

const inMemoryFragments: Fragment[] = [];
let fragmentsGenerated = false;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabase = getSupabase();

  // ─── GET: User's collected fragments ───
  if (req.method === "GET") {
    const address = (req.query.address as string || "").toLowerCase();
    if (!address) return res.status(400).json({ error: "address required" });

    // Get fragments this user can see (collected by them)
    if (supabase) {
      const { data: collected } = await supabase
        .from("treasure_fragments")
        .select("*")
        .eq("collected_by", address);

      const { data: redeemed } = await supabase
        .from("treasure_fragments")
        .select("redeemed")
        .eq("collected_by", address)
        .eq("redeemed", true)
        .limit(1);

      return res.status(200).json({
        collected: collected || [],
        count: (collected || []).length,
        needed: FRAGMENTS_NEEDED,
        canRedeem: (collected || []).length >= FRAGMENTS_NEEDED,
        hasRedeemed: (redeemed || []).length > 0,
      });
    }

    // In-memory fallback
    const collected = inMemoryFragments.filter(
      (f) => f.collected_by === address,
    );
    return res.status(200).json({
      collected,
      count: collected.length,
      needed: FRAGMENTS_NEEDED,
      canRedeem: collected.length >= FRAGMENTS_NEEDED,
      hasRedeemed: collected.some((f) => f.redeemed),
    });
  }

  // ─── POST ───
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, password, address, agentName } = req.body || {};

  // ─── Generate fragments (instructor) ───
  if (action === "generate") {
    if (!INSTRUCTOR_PASSWORD) {
      return res.status(503).json({ error: "Sistem yapilandirmasi eksik" });
    }
    if (!safePasswordCompare(password || "", INSTRUCTOR_PASSWORD)) {
      return res.status(403).json({ error: "Invalid password" });
    }

    if (supabase) {
      // Get all registered agents
      const { data: agents } = await supabase
        .from("agent_registry")
        .select("agent_name, owner_address, archetype");

      if (!agents || agents.length === 0) {
        return res.status(400).json({ error: "No agents registered yet" });
      }

      // Delete old fragments
      await supabase.from("treasure_fragments").delete().neq("id", "");

      // Create one fragment per agent
      const fragments = agents.map((a) => ({
        owner_agent: a.agent_name,
        owner_address: a.owner_address.toLowerCase(),
        archetype: a.archetype || "default",
        fragment_code: generateCode(),
        collected_by: null,
        collected_at: null,
        redeemed: false,
      }));

      await supabase.from("treasure_fragments").insert(fragments);

      // Post activity event
      try {
        const proto = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers["x-forwarded-host"] || req.headers.host || "";
        await fetch(`${proto}://${host}/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "treasure_hunt_started",
            address: "instructor",
            data: { fragmentCount: String(fragments.length) },
          }),
        });
      } catch { /* best-effort */ }

      return res.status(200).json({ ok: true, fragmentCount: fragments.length });
    }

    // In-memory fallback — use stored agents from the agents module
    fragmentsGenerated = true;
    inMemoryFragments.length = 0;
    // We can't easily access agent registry from here in memory, so just acknowledge
    return res.status(200).json({ ok: true, fragmentCount: 0, note: "In-memory: requires Supabase for full functionality" });
  }

  // ─── Collect a fragment ───
  if (action === "collect") {
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Geçersiz adres" });
    }
    const collectorAddress = address.toLowerCase();
    if (!agentName) {
      return res.status(400).json({ error: "agentName required" });
    }

    if (supabase) {
      // Check if this fragment exists and is not already collected
      const { data: fragment } = await supabase
        .from("treasure_fragments")
        .select("*")
        .eq("owner_agent", agentName)
        .is("collected_by", null)
        .limit(1)
        .single();

      if (!fragment) {
        // Check if already collected by this user
        const { data: ownCollected } = await supabase
          .from("treasure_fragments")
          .select("id")
          .eq("owner_agent", agentName)
          .eq("collected_by", collectorAddress)
          .limit(1);

        if (ownCollected && ownCollected.length > 0) {
          return res.status(409).json({ error: "Bu fragmenti zaten topladin" });
        }
        return res.status(404).json({ error: "Fragment bulunamadi veya baskasi tarafindan toplandi" });
      }

      // Can't collect own fragment
      if (fragment.owner_address === collectorAddress) {
        return res.status(400).json({ error: "Kendi fragmentini toplayamazsin" });
      }

      // Collect it
      await supabase
        .from("treasure_fragments")
        .update({
          collected_by: collectorAddress,
          collected_at: new Date().toISOString(),
        })
        .eq("id", fragment.id);

      // Post activity
      try {
        const proto = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers["x-forwarded-host"] || req.headers.host || "";
        await fetch(`${proto}://${host}/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "fragment_collected",
            address: collectorAddress,
            data: { agentName, fragmentCode: fragment.fragment_code },
          }),
        });
      } catch { /* best-effort */ }

      // Check how many they now have
      const { data: allCollected } = await supabase
        .from("treasure_fragments")
        .select("id")
        .eq("collected_by", collectorAddress);
      const count = (allCollected || []).length;

      return res.status(200).json({
        ok: true,
        fragmentCode: fragment.fragment_code,
        archetype: fragment.archetype,
        collected: count,
        needed: FRAGMENTS_NEEDED,
        canRedeem: count >= FRAGMENTS_NEEDED,
      });
    }

    return res.status(500).json({ error: "Supabase required for treasure hunt" });
  }

  // ─── Redeem fragments ───
  if (action === "redeem") {
    if (!isValidAddress(address)) {
      return res.status(400).json({ error: "Geçersiz adres" });
    }
    const redeemer = address.toLowerCase();

    if (supabase) {
      const { data: collected } = await supabase
        .from("treasure_fragments")
        .select("*")
        .eq("collected_by", redeemer)
        .eq("redeemed", false);

      if (!collected || collected.length < FRAGMENTS_NEEDED) {
        return res.status(400).json({
          error: `${FRAGMENTS_NEEDED} fragment gerekli, ${(collected || []).length} topladin`,
        });
      }

      // Mark first FRAGMENTS_NEEDED as redeemed
      const toRedeem = collected.slice(0, FRAGMENTS_NEEDED);
      await supabase
        .from("treasure_fragments")
        .update({ redeemed: true })
        .in("id", toRedeem.map((f) => f.id));

      // Post badge activity event
      try {
        const proto = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers["x-forwarded-host"] || req.headers.host || "";
        await fetch(`${proto}://${host}/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "treasure_redeemed",
            address: redeemer,
            data: { badge: "Master Scout" },
          }),
        });
      } catch { /* best-effort */ }

      return res.status(200).json({ ok: true, badge: "Master Scout" });
    }

    return res.status(500).json({ error: "Supabase required" });
  }

  return res.status(400).json({ error: "Unknown action" });
}
