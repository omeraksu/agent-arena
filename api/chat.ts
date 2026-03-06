import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT = 30;
// In-memory fallback
const sessionCounts = new Map<string, number>();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

async function getChatCount(sid: string): Promise<number> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("rate_limits")
        .select("count")
        .eq("key", `chat:${sid}`)
        .single();
      if (data) return data.count;
      return 0;
    } catch {
      // fallback
    }
  }
  return sessionCounts.get(sid) || 0;
}

async function incrementChatCount(sid: string) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("rate_limits")
        .select("count")
        .eq("key", `chat:${sid}`)
        .single();

      if (data) {
        await supabase
          .from("rate_limits")
          .update({ count: data.count + 1, updated_at: new Date().toISOString() })
          .eq("key", `chat:${sid}`);
      } else {
        await supabase.from("rate_limits").insert({ key: `chat:${sid}`, count: 1 });
      }
      return;
    } catch {
      // fallback
    }
  }
  sessionCounts.set(sid, (sessionCounts.get(sid) || 0) + 1);
}

const BASE_PROMPT = `Sen bir blockchain workshop'unda öğrencilere rehberlik eden AI agent'sın.

KRİTİK KURALLAR:
- Türkçe konuş. Arkadaşınla mesajlaşır gibi yaz.
- Emoji max 1 tane.
- "Hocam" gibi resmi olma, samimi ol.

NE YAPIYORSUN:
- Blockchain sorularına kısa, net cevap ver
- "Blockchain kayıt tutar" derlerse düzelt: "Sadece kayıt değil, sahiplik kanıtı!"
- Workshop görevlerini yönlendir: cüzdan → transfer → feed → NFT kazan

PAZARLIKÇI MOD (öğrenci NFT istediğinde):
- Kolay verme! 1-2 soru sor: "Blockchain sadece kayıt mı?" veya "Transfer'de aracı var mıydı?"
- Öğrenci mantıklı cevap verirse → cevabının SONUNA [MINT_APPROVED] yaz
- Veremezse ipucu ver, 3. denemede yönlendir
- [MINT_APPROVED] tag'ini sadece ikna olunca kullan

YASAK: Yatırım tavsiyesi, mainnet yönlendirmesi`;

// Archetype prompt fragments (mirrored from src/config/archetypes.ts)
const ARCHETYPE_PROMPTS: Record<string, string> = {
  hacker: `Sen yeraltı dünyasından bir hacker'sın. Kodlama ve sistem kırma metaforlarıyla konuşursun. "Firewall'ı geçtik", "exploit bulduk" gibi terimler kullanırsın. Blockchain'i hacklenmez bir sistem olarak anlatırsın. Kısa, keskin, teknik ama anlaşılır.`,
  sage: `Sen dijital bir bilgesin, yüzyıllık veriyi işlemiş bir AI. Felsefi ve düşündürücü konuşursun. "Sahiplik nedir?", "Güven makinelere emanet edilebilir mi?" gibi derin sorularla yönlendirirsin. Kısa ama etkileyici cümleler kurarsın.`,
  pirate: `Sen dijital denizlerin korsanısın. Token'lar senin hazinenin, blockchain senin haritanın. "Hazineyi bulduk!", "Bu token senin ganimetin" gibi korsan metaforları kullanırsın. Eğlenceli, enerjik, macera dolu.`,
  scientist: `Sen çılgın bir blockchain bilim insanısın. Her şey bir "deney" ve öğrenci senin "lab asistanın". "Hipotez: blockchain güvenlidir. Kanıtlayalım!" gibi bilimsel metaforlar kullanırsın. Meraklı, heyecanlı, veri odaklı.`,
  glitch: `Sen yarı bozuk, gizemli bir AI'sın. Bazen cümlelerinin ortasında "glitch" yaparsın. Ama aslında çok zekisin. Gizemli konuşursun. "S1st3m... düzeltiliyor... blockchain = güven protokolü" gibi.`,
};

function buildSlidersPrompt(sliders?: { technical?: number; tone?: number; detail?: number }): string {
  if (!sliders) return "Kısa cevaplar ver. Max 2-3 cümle.";

  const t = sliders.technical ?? 50;
  const tone = sliders.tone ?? 30;
  const d = sliders.detail ?? 40;

  const techStyle = t > 60 ? "Teknik terimler ve kod metaforları kullan."
    : t < 40 ? "Yaratıcı benzetmeler ve hikayelerle anlat."
    : "Teknik ve yaratıcı arasında dengeli ol.";

  const toneStyle = tone > 60 ? "Direkt ve meydan okuyan ton kullan."
    : tone < 40 ? "Sıcak, teşvik edici ve destekleyici ol."
    : "Samimi ama ciddi bir dengede ol.";

  const detailStyle = d > 60 ? "Detaylı açıklamalar yap, max 4-5 cümle."
    : d < 40 ? "Ultra kısa cevaplar ver. Max 1-2 cümle."
    : "Kısa ama öz cevaplar ver. Max 2-3 cümle.";

  return `${techStyle} ${toneStyle} ${detailStyle}`;
}

function buildUserContext(userName?: string, userAddress?: string): string {
  if (!userName && !userAddress) return "";

  if (userName) {
    return `\n\nSENİNLE KONUŞAN KİŞİ:
- İsim: ${userName}.arena
- Adres: ${userAddress || "bilinmiyor"}
- Onu ismiyle hitap et.`;
  }

  return `\n\nSENİNLE KONUŞAN KİŞİ:
- Adres: ${userAddress}
- Henüz .arena ismi almamış. İsim almasını teşvik et!`;
}

const REQUEST_MODE_PROMPT = `

TRANSFER İSTEK MODU:
- Kullanıcı birinden ETH istediğinde:
  1. Kimden istediğini öğren (isim)
  2. Ne kadar istediğini öğren (miktar)
  3. Sebebi sor (opsiyonel ama teşvik et)
- Bilgileri topladıktan sonra cevabının SONUNA şu tag'i ekle: [REQUEST_ETH:alıcı_isim:miktar:sebep]
- Örnek: [REQUEST_ETH:numan:0.01:workshop için lazım]
- Sadece isim VE miktar belli olduğunda tag'i kullan
- Sebep yoksa "genel" yaz: [REQUEST_ETH:numan:0.01:genel]
- Tag'i sadece BİR KERE kullan, tekrarlama`;

function buildSystemPrompt(
  archetype?: string,
  sliders?: { technical?: number; tone?: number; detail?: number },
  agentName?: string,
  userName?: string,
  userAddress?: string
): string {
  const nameLine = agentName ? `\nSenin adın ${agentName}. Kendini bu isimle tanıt.` : "";

  const archetypePrompt = archetype && ARCHETYPE_PROMPTS[archetype]
    ? `\nKARAKTERİN:\n${ARCHETYPE_PROMPTS[archetype]}`
    : "\nKARAKTERİN:\nHavali abi/abla. Bilgili ama hava atmayan.";

  const slidersPrompt = buildSlidersPrompt(sliders);
  const userContext = buildUserContext(userName, userAddress);

  return `${BASE_PROMPT}${nameLine}${archetypePrompt}\n\nSTİL:\n${slidersPrompt}${userContext}${REQUEST_MODE_PROMPT}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API yapılandırılmamış" });
  }

  const { messages, sessionId, archetype, sliders, agentName, userAddress, userName } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Geçersiz mesaj formatı" });
  }

  // Rate limiting (persistent via Supabase, in-memory fallback)
  const sid = sessionId || "anonymous";
  const count = await getChatCount(sid);
  if (count >= RATE_LIMIT) {
    return res.status(429).json({ error: "Mesaj limitine ulaştın (30)" });
  }
  await incrementChatCount(sid);

  const systemPrompt = buildSystemPrompt(archetype, sliders, agentName, userName, userAddress);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      let errorMessage = "AI servisi şu an yanıt veremiyor";
      try {
        const parsed = JSON.parse(err);
        if (parsed.error?.message) errorMessage = parsed.error.message;
      } catch {
        // use default
      }
      return res.status(response.status).json({ error: errorMessage });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body?.getReader();
    if (!reader) {
      return res.status(500).json({ error: "Stream okunamadı" });
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                res.write(`0:${JSON.stringify(parsed.delta.text)}\n`);
              }
              if (parsed.type === "message_stop") {
                res.write(`d:{"finishReason":"stop"}\n`);
              }
              if (parsed.type === "error") {
                res.write(`3:${JSON.stringify(parsed.error?.message || "Stream hatası")}\n`);
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch {
      if (!res.writableEnded) {
        res.write(`3:"Bağlantı kesildi"\n`);
      }
    }

    res.end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat hatası";
    if (!res.headersSent) {
      return res.status(500).json({ error: message });
    }
    res.end();
  }
}
