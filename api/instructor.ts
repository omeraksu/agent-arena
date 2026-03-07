import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "./_lib/supabase.js";
import { BoundedMap } from "./_lib/bounded-map.js";
import { invalidateResetCache, getSessionResetTime } from "./_lib/session-reset-cache.js";

// In-memory fallback stores
const inMemoryEvents: Array<{
  id: string;
  type: string;
  address: string;
  data: Record<string, string>;
  created_at: string;
}> = [];

let isFrozen = false;

// Oracle recap cache & prompt
const recapCache = new BoundedMap<string, { title: string; description: string; traits: string[]; emoji: string }>(100);
const ORACLE_PROMPT = `Sen Oracle, Agent Arena'nin bilge yapay zekasisin.
Bir ogrencinin workshop aktivitelerini analiz edip kisa bir karakter profili cikar.

Cikti formati (JSON):
{
  "title": "Gizli Mimar",
  "description": "...",
  "traits": ["Hizli Ogrenci", "Sosyal Baglayici", "Risk Alici"],
  "emoji": "🔮"
}

Kurallar:
- Turkce yaz
- Tesvik edici ol, elestirme
- Her ogrenci icin benzersiz analiz yap
- Blockchain jargonu kullanabilirsin ama anlasilir olsun
- Title 2-3 kelime, etkileyici olsun
- Description 2-3 cumle, samimi ve tesvik edici
- Tam 3 trait ver
- Sadece JSON don, baska bir sey yazma`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, password, message } = req.body;
  const expectedPassword = process.env.INSTRUCTOR_PASSWORD || "arena2026";

  // Recap doesn't require password (student-facing)
  if (action !== "recap" && password !== expectedPassword) {
    return res.status(401).json({ error: "Yetkisiz erisim" });
  }

  const supabase = getSupabase();

  switch (action) {
    case "broadcast": {
      if (!message) return res.status(400).json({ error: "Mesaj gerekli" });

      const event = {
        id: crypto.randomUUID(),
        type: "instructor_broadcast",
        address: "instructor",
        data: { message },
        created_at: new Date().toISOString(),
      };

      if (supabase) {
        const { error } = await supabase.from("activity_events").insert(event);
        if (error) return res.status(500).json({ error: error.message });
      } else {
        inMemoryEvents.push(event);
      }

      return res.status(200).json({ ok: true, event });
    }

    case "freeze": {
      isFrozen = true;
      const event = {
        id: crypto.randomUUID(),
        type: "freeze",
        address: "instructor",
        data: { message: "Workshop donduruldu" },
        created_at: new Date().toISOString(),
      };
      if (supabase) {
        await supabase.from("activity_events").insert(event);
      } else {
        inMemoryEvents.push(event);
      }
      return res.status(200).json({ ok: true, frozen: true });
    }

    case "unfreeze": {
      isFrozen = false;
      const event = {
        id: crypto.randomUUID(),
        type: "unfreeze",
        address: "instructor",
        data: { message: "Workshop devam ediyor" },
        created_at: new Date().toISOString(),
      };
      if (supabase) {
        await supabase.from("activity_events").insert(event);
      } else {
        inMemoryEvents.push(event);
      }
      return res.status(200).json({ ok: true, frozen: false });
    }

    case "stats": {
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

      let events: Array<{ type: string; address: string }> = [];

      if (supabase) {
        const { data } = await supabase
          .from("activity_events")
          .select("type, address")
          .limit(5000);
        events = data || [];
      }

      const counts: Record<string, number> = {};
      let totalXP = 0;
      const uniqueAddresses = new Set<string>();

      for (const e of events) {
        counts[e.type] = (counts[e.type] || 0) + 1;
        totalXP += XP_VALUES[e.type] || 0;
        if (e.address && e.address !== "instructor") {
          uniqueAddresses.add(e.address.toLowerCase());
        }
      }

      return res.status(200).json({
        ok: true,
        frozen: isFrozen,
        stats: {
          participants: uniqueAddresses.size,
          transfers: counts.transfer || 0,
          nftMints: counts.nft_mint || 0,
          faucetDrips: counts.faucet || 0,
          walletsCreated: counts.wallet_created || 0,
          agentsRegistered: counts.agent_registered || 0,
          memesSubmitted: counts.meme_submitted || 0,
          signalPulses: counts.signal_pulse || 0,
          totalXP,
          totalEvents: events.length,
        },
      });
    }

    case "end_workshop": {
      const endEvent = {
        id: crypto.randomUUID(),
        type: "workshop_ended",
        address: "instructor",
        data: { message: "Workshop tamamlandi! Oracle analizinizi alabilirsiniz." },
        created_at: new Date().toISOString(),
      };
      if (supabase) {
        const { error } = await supabase.from("activity_events").insert(endEvent);
        if (error) return res.status(500).json({ error: error.message });
      } else {
        inMemoryEvents.push(endEvent);
      }
      return res.status(200).json({ ok: true, event: endEvent });
    }

    case "recap": {
      const { address: recapAddress } = req.body;
      if (!recapAddress) return res.status(400).json({ error: "address gerekli" });

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "API yapilandirilmamis" });

      const cacheKey = recapAddress.toLowerCase();

      // Check cache
      if (recapCache.has(cacheKey)) {
        return res.status(200).json({ recap: recapCache.get(cacheKey) });
      }

      // Fetch activities + chat in parallel
      let activities: Array<{ type: string; data: Record<string, string>; created_at: string }> = [];
      let chatSummary = "";
      if (supabase) {
        const [actResult, chatResult] = await Promise.all([
          supabase
            .from("activity_events")
            .select("type, data, created_at")
            .eq("address", cacheKey)
            .order("created_at", { ascending: true }),
          supabase
            .from("chat_sessions")
            .select("archetype, agent_name, messages")
            .eq("address", cacheKey)
            .limit(1)
            .single(),
        ]);
        activities = actResult.data || [];
        const chatData = chatResult.data;
        if (chatData) {
          const msgCount = Array.isArray(chatData.messages) ? chatData.messages.length : 0;
          chatSummary = `Archetype: ${chatData.archetype || "bilinmiyor"}, Agent: ${chatData.agent_name || "bilinmiyor"}, Mesaj sayisi: ${msgCount}`;
        }
      }

      const typeCounts: Record<string, number> = {};
      for (const a of activities) {
        typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
      }
      const activitySummary = Object.entries(typeCounts)
        .map(([type, count]) => `${type}: ${count}`)
        .join(", ");

      const userPrompt = `Bu ogrencinin workshop aktiviteleri:
- Toplam event: ${activities.length}
- Detay: ${activitySummary || "henuz aktivite yok"}
${chatSummary ? `- Chat: ${chatSummary}` : ""}
- Ilk aktivite: ${activities[0]?.created_at || "yok"}
- Son aktivite: ${activities[activities.length - 1]?.created_at || "yok"}

Bu verilere dayanarak kisa bir karakter analizi yap.`;

      try {
        const client = new Anthropic({ apiKey });
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system: ORACLE_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return res.status(500).json({ error: "Oracle analiz olusturamadi" });

        const recap = JSON.parse(jsonMatch[0]);
        if (!recap.title || !recap.description || !Array.isArray(recap.traits)) {
          return res.status(500).json({ error: "Gecersiz analiz formati" });
        }

        recapCache.set(cacheKey, recap);
        return res.status(200).json({ recap });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Oracle hatasi";
        return res.status(500).json({ error: errMsg });
      }
    }

    case "export_session": {
      if (!supabase) return res.status(500).json({ error: "Supabase yapilandirilmamis" });

      const tables = [
        "activity_events",
        "chat_sessions",
        "arena_names",
        "transfer_requests",
        "agent_registry",
        "agent_messages",
        "nft_mints",
        "nft_metadata",
        "nft_metadata_drafts",
        "rate_limits",
        "memes",
      ] as const;

      const result: Record<string, unknown[]> = {};
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*").limit(10000);
        if (error) {
          result[table] = [];
        } else {
          result[table] = data || [];
        }
      }

      return res.status(200).json({
        exportedAt: new Date().toISOString(),
        tables: result,
      });
    }

    case "reset_session": {
      const { confirm } = req.body;
      if (confirm !== "SIFIRLA") {
        return res.status(400).json({ error: "Onay gerekli: confirm alanina 'SIFIRLA' yazin" });
      }
      if (!supabase) return res.status(500).json({ error: "Supabase yapilandirilmamis" });

      const tables = [
        "activity_events",
        "chat_sessions",
        "arena_names",
        "transfer_requests",
        "agent_registry",
        "agent_messages",
        "nft_mints",
        "nft_metadata",
        "nft_metadata_drafts",
        "rate_limits",
        "memes",
      ] as const;

      const deleted: Record<string, number> = {};
      // Map table → primary key column (for DELETE filter)
      const pkMap: Record<string, string> = {
        arena_names: "address",
        agent_registry: "session_id",
        rate_limits: "key",
        nft_metadata: "token_id",
        nft_metadata_drafts: "address",
      };
      for (const table of tables) {
        const pk = pkMap[table] || "id";
        const { data, error } = await supabase
          .from(table)
          .delete()
          .not(pk, "is", null)
          .select(pk);
        if (error) {
          deleted[table] = -1;
        } else {
          deleted[table] = data?.length || 0;
        }
      }

      // Clear in-memory state
      recapCache.clear();
      isFrozen = false;
      inMemoryEvents.length = 0;

      // Broadcast session_reset so connected clients clear localStorage & reload
      const resetEvent = {
        id: crypto.randomUUID(),
        type: "session_reset",
        address: "instructor",
        data: { message: "Oturum sifirlandı — yeni workshop basliyor" },
        created_at: new Date().toISOString(),
      };
      await supabase.from("activity_events").insert(resetEvent);
      invalidateResetCache();

      return res.status(200).json({ ok: true, deleted });
    }

    case "finalize_meme": {
      if (!supabase) return res.status(500).json({ error: "Supabase yapilandirilmamis" });

      // Get session boundary (cached)
      const resetTime = await getSessionResetTime(supabase);

      // Find top voted meme in session
      let memeQuery = supabase
        .from("memes")
        .select("*")
        .order("vote_count", { ascending: false })
        .limit(1);
      if (resetTime) memeQuery = memeQuery.gt("created_at", resetTime);

      const { data: topMemes, error: memeErr } = await memeQuery;
      if (memeErr || !topMemes || topMemes.length === 0) {
        return res.status(404).json({ error: "Hic meme bulunamadi" });
      }

      const winner = topMemes[0];

      // Mark as winner
      await supabase
        .from("memes")
        .update({ is_winner: true })
        .eq("id", winner.id);

      // Mint NFT for winner via internal call
      try {
        const proto = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers["x-forwarded-host"] || req.headers.host || "";
        const mintRes = await fetch(`${proto}://${host}/api/mint`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: winner.address,
            draftName: `Meme King: ${winner.title}`,
            draftDescription: `Bu NFT, sinifin en cok oylanan meme'ini yaratarak kazanildi! "${winner.title}" — ${winner.vote_count} oy.`,
            draftImageUrl: winner.image_url,
          }),
        });
        const mintData = await mintRes.json();

        if (mintData.tokenId !== undefined) {
          await supabase
            .from("memes")
            .update({ nft_token_id: mintData.tokenId })
            .eq("id", winner.id);
        }

        // Activity event for winner
        await supabase.from("activity_events").insert({
          id: crypto.randomUUID(),
          type: "meme_winner",
          address: winner.address,
          data: {
            memeId: winner.id,
            title: winner.title,
            voteCount: String(winner.vote_count),
            username: winner.username || "",
          },
          created_at: new Date().toISOString(),
        });

        return res.status(200).json({
          ok: true,
          winner: {
            id: winner.id,
            title: winner.title,
            address: winner.address,
            voteCount: winner.vote_count,
            tokenId: mintData.tokenId,
          },
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Mint hatasi";
        return res.status(500).json({ error: errMsg });
      }
    }

    default:
      return res.status(400).json({ error: `Bilinmeyen aksiyon: ${action}` });
  }
}
