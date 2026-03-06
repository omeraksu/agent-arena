/**
 * GET /api/nfts?address=0x...
 * Returns all NFT metadata for a given address.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const address = req.query.address as string;
  if (!address) {
    return res.status(400).json({ error: "address query param required" });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(200).json([]);
  }

  const { data, error } = await supabase
    .from("nft_metadata")
    .select("*")
    .eq("address", address.toLowerCase())
    .order("token_id", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data || []);
}
