import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

interface NftMetadataRow {
  token_id: number;
  address: string;
  name: string;
  description: string;
  image: string;
  workshop_name: string;
  workshop_date: string;
  arena_name: string | null;
  archetype: string | null;
  agent_name: string | null;
  achievement: string;
  extra_attributes: Record<string, string>;
}

function buildAttributes(row: NftMetadataRow) {
  const attrs: Array<{ trait_type: string; value: string }> = [
    { trait_type: "Workshop", value: row.workshop_name },
    { trait_type: "Date", value: row.workshop_date },
    { trait_type: "Achievement", value: row.achievement },
  ];
  if (row.archetype) {
    attrs.push({ trait_type: "Archetype", value: row.archetype });
  }
  if (row.agent_name) {
    attrs.push({ trait_type: "Agent Name", value: row.agent_name });
  }
  if (row.arena_name) {
    attrs.push({ trait_type: "Arena Name", value: row.arena_name });
  }
  if (row.extra_attributes) {
    for (const [k, v] of Object.entries(row.extra_attributes)) {
      attrs.push({ trait_type: k, value: v });
    }
  }
  return attrs;
}

function fallbackMetadata(tokenId: string, baseUrl: string) {
  return {
    name: `Agent Arena #${tokenId}`,
    description: "Agent Arena Workshop katilimci NFT'si.",
    image: `${baseUrl}/nft/default.svg`,
    attributes: [
      { trait_type: "Workshop", value: "Agent Arena Workshop" },
      { trait_type: "Achievement", value: "participant" },
    ],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const tokenId = req.query.tokenId as string;
  if (!tokenId || isNaN(Number(tokenId))) {
    return res.status(400).json({ error: "Invalid tokenId" });
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "agent-arena.vercel.app";
  const baseUrl = `${proto}://${host}`;

  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.setHeader("Content-Type", "application/json");

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(200).json(fallbackMetadata(tokenId, baseUrl));
  }

  const { data, error } = await supabase
    .from("nft_metadata")
    .select("*")
    .eq("token_id", Number(tokenId))
    .limit(1)
    .single();

  if (error || !data) {
    return res.status(200).json(fallbackMetadata(tokenId, baseUrl));
  }

  const row = data as NftMetadataRow;

  // Resolve image URL — if relative, make absolute
  const image = row.image.startsWith("http") ? row.image : `${baseUrl}${row.image}`;

  return res.status(200).json({
    name: row.name,
    description: row.description,
    image,
    attributes: buildAttributes(row),
  });
}
