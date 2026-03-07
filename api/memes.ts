import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "./_lib/supabase.js";
import { getSessionResetTime } from "./_lib/session-reset-cache.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: "Supabase yapilandirilmamis" });
  }

  // ─── GET: List memes ───
  if (req.method === "GET") {
    const resetTime = await getSessionResetTime(supabase);

    let query = supabase
      .from("memes")
      .select("*")
      .order("vote_count", { ascending: false });
    if (resetTime) query = query.gt("created_at", resetTime);

    const { data: memes, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Check if requesting address has already submitted
    let hasSubmitted = false;
    const address = req.query.address as string | undefined;
    if (address) {
      const existing = (memes || []).find(
        (m: { address: string }) => m.address.toLowerCase() === address.toLowerCase()
      );
      hasSubmitted = !!existing;
    }

    return res.status(200).json({ memes: memes || [], hasSubmitted });
  }

  // ─── POST: Submit or Vote ───
  if (req.method === "POST") {
    const { action } = req.body;

    // ── Vote ──
    if (action === "vote") {
      const { memeId, voterAddress } = req.body;
      if (!memeId || !voterAddress) {
        return res.status(400).json({ error: "memeId ve voterAddress gerekli" });
      }

      // Get meme to check self-vote
      const { data: meme, error: memeErr } = await supabase
        .from("memes")
        .select("id, address, vote_count")
        .eq("id", memeId)
        .single();
      if (memeErr || !meme) return res.status(404).json({ error: "Meme bulunamadi" });

      if (meme.address.toLowerCase() === voterAddress.toLowerCase()) {
        return res.status(400).json({ error: "Kendi meme'ine oy veremezsin" });
      }

      // Check duplicate vote via activity_events
      const { data: existingVote } = await supabase
        .from("activity_events")
        .select("id")
        .eq("type", "meme_voted")
        .eq("address", voterAddress.toLowerCase())
        .eq("data->>memeId", memeId)
        .limit(1);

      if (existingVote && existingVote.length > 0) {
        return res.status(400).json({ error: "Bu meme'e zaten oy verdin" });
      }

      // Increment vote count
      const { error: updateErr } = await supabase
        .from("memes")
        .update({ vote_count: (meme.vote_count || 0) + 1 })
        .eq("id", memeId);
      if (updateErr) return res.status(500).json({ error: updateErr.message });

      // Activity event
      await supabase.from("activity_events").insert({
        id: crypto.randomUUID(),
        type: "meme_voted",
        address: voterAddress.toLowerCase(),
        data: { memeId, memeTitle: req.body.memeTitle || "" },
        created_at: new Date().toISOString(),
      });

      return res.status(200).json({ ok: true, newVoteCount: (meme.vote_count || 0) + 1 });
    }

    // ── Submit meme ──
    const { address, username, title, imageBase64, mimeType } = req.body;
    if (!address || !title || !imageBase64) {
      return res.status(400).json({ error: "address, title ve imageBase64 gerekli" });
    }

    if (title.length > 50) {
      return res.status(400).json({ error: "Baslik en fazla 50 karakter" });
    }

    // Check if already submitted in current session
    const resetTime = await getSessionResetTime(supabase);

    let existingQuery = supabase
      .from("memes")
      .select("id")
      .eq("address", address.toLowerCase());
    if (resetTime) existingQuery = existingQuery.gt("created_at", resetTime);
    const { data: existing } = await existingQuery;

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Bu session'da zaten meme yukledin" });
    }

    // Store image as data URI directly in the memes table
    // (avoids Storage RLS issues; workshop scale ~45 memes is fine)
    const dataUri = `data:${mimeType || "image/png"};base64,${imageBase64}`;

    // Insert meme record
    const memeId = crypto.randomUUID();
    const { error: insertErr } = await supabase.from("memes").insert({
      id: memeId,
      address: address.toLowerCase(),
      username: username || null,
      title,
      image_url: dataUri,
      vote_count: 0,
      is_winner: false,
      nft_token_id: null,
      created_at: new Date().toISOString(),
    });
    if (insertErr) return res.status(500).json({ error: insertErr.message });

    // Activity event
    await supabase.from("activity_events").insert({
      id: crypto.randomUUID(),
      type: "meme_submitted",
      address: address.toLowerCase(),
      data: { memeId, title, username: username || "" },
      created_at: new Date().toISOString(),
    });

    return res.status(201).json({ ok: true, memeId });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
