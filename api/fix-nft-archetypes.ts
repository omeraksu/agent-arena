/**
 * Fix NFT Archetypes — One-time migration endpoint
 *
 * POST /api/fix-nft-archetypes
 *
 * Updates null-archetype NFTs in nft_metadata table
 * by matching their name to an archetype, and sets
 * the image path to the corresponding SVG.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_lib/supabase.js";

// Name pattern → archetype mapping
const NAME_TO_ARCHETYPE: Record<string, string> = {
  "token avcisi": "pirate",
  "arena savasçisi": "hacker",
  "arena savasçısı": "hacker",
  "arena savascisi": "hacker",
  "kripto gezgin": "pirate",
  "dijital öncü": "scientist",
  "dijital oncu": "scientist",
  "konsensus kahramani": "sage",
  "konsensus kahramanı": "sage",
  "dijital kaşif": "scientist",
  "dijital kasif": "scientist",
  "hash muhafizi": "hacker",
  "hash muhafızı": "hacker",
};

function matchArchetype(name: string): string | null {
  const lower = name.toLowerCase().trim();
  // Direct match
  if (NAME_TO_ARCHETYPE[lower]) return NAME_TO_ARCHETYPE[lower];
  // Partial match
  for (const [pattern, archetype] of Object.entries(NAME_TO_ARCHETYPE)) {
    if (lower.includes(pattern)) return archetype;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // Fetch NFTs with null archetype
  const { data: nullNfts, error: fetchError } = await supabase
    .from("nft_metadata")
    .select("token_id, name, archetype, image")
    .is("archetype", null);

  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }

  if (!nullNfts || nullNfts.length === 0) {
    return res.status(200).json({ message: "No null-archetype NFTs found", updated: 0 });
  }

  const updates: Array<{ token_id: number; name: string; archetype: string; image: string }> = [];
  const skipped: Array<{ token_id: number; name: string; reason: string }> = [];

  for (const nft of nullNfts) {
    const matched = matchArchetype(nft.name || "");
    if (matched) {
      updates.push({
        token_id: nft.token_id,
        name: nft.name,
        archetype: matched,
        image: `/nft/${matched}.svg`,
      });
    } else {
      skipped.push({
        token_id: nft.token_id,
        name: nft.name,
        reason: "No archetype match found",
      });
    }
  }

  // Apply updates
  let successCount = 0;
  const errors: Array<{ token_id: number; error: string }> = [];

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from("nft_metadata")
      .update({ archetype: update.archetype, image: update.image })
      .eq("token_id", update.token_id);

    if (updateError) {
      errors.push({ token_id: update.token_id, error: updateError.message });
    } else {
      successCount++;
    }
  }

  return res.status(200).json({
    message: `Updated ${successCount} NFTs`,
    updated: successCount,
    details: updates.map((u) => ({
      token_id: u.token_id,
      name: u.name,
      archetype: u.archetype,
    })),
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
