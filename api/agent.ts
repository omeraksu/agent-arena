/**
 * Agent Endpoint — Anthropic API native tool calling
 *
 * Strands SDK yerine @anthropic-ai/sdk ile doğrudan tool use.
 * SSE formatında stream eder (Vercel AI SDK useChat uyumlu).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { formatEther } from "viem";
import { getSupabase } from "./_lib/supabase.js";
import { publicClient } from "./_lib/viem.js";
import { BoundedMap } from "./_lib/bounded-map.js";
import { TOKEN_SYMBOL, EXPLORER_TX_URL, EXPLORER_ADDRESS_URL, FAUCET_AMOUNT } from "./_lib/brand.js";
import { TEAM1_KNOWLEDGE } from "./_lib/team1-knowledge.js";

// ─── Chat Rate Limiting ─────────────────────────────────────────────────

const CHAT_RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_SESSION || "60", 10);
const chatRateLimits = new BoundedMap<string, number>(500); // in-memory fallback

/**
 * Check and increment chat rate limit.
 * Primary: Supabase (persistent across cold starts).
 * Fallback: in-memory BoundedMap.
 */
async function checkChatRateLimit(
  supabase: ReturnType<typeof getSupabase>,
  key: string,
  limit: number,
): Promise<boolean> {
  if (supabase) {
    try {
      const rateKey = `chat:${key}`;
      const now = new Date().toISOString();

      // Try insert first
      const { error: insertError } = await supabase
        .from("rate_limits")
        .insert({ key: rateKey, count: 1, updated_at: now });

      if (!insertError) return true; // first message, allowed

      // Row exists — read + increment
      const { data } = await supabase
        .from("rate_limits")
        .select("count")
        .eq("key", rateKey)
        .single();

      if (data && data.count >= limit) return false;

      const newCount = (data?.count || 0) + 1;
      await supabase
        .from("rate_limits")
        .update({ count: newCount, updated_at: now })
        .eq("key", rateKey);

      return newCount <= limit;
    } catch {
      // fallback to in-memory
    }
  }

  // In-memory fallback
  const count = chatRateLimits.get(key) || 0;
  if (count >= limit) return false;
  chatRateLimits.set(key, count + 1);
  return true;
}

// ─── Tool Definitions (Anthropic format) ───────────────────────────────

const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "mint_nft",
    description:
      "Öğrenci agent'ı ikna ettiğinde NFT mint eder. Sadece öğrenci blockchain bilgisini kanıtladığında kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: {
          type: "string",
          description: "Öğrencinin neden NFT hak ettiğinin kısa açıklaması",
        },
        level: {
          type: "number",
          description: "Öğrencinin ikna kalitesi: 1=temel (2 doğru cevap), 2=derin anlayış (yaratıcı argüman+teknik), 3=uzman (seni şaşırtan cevap)",
          enum: [1, 2, 3],
        },
      },
      required: ["reason", "level"],
    },
  },
  {
    name: "request_transfer",
    description:
      `Başka bir öğrenciden ${TOKEN_SYMBOL} transfer isteği gönderir. Hedef kişinin .arena ismi, miktar ve sebep gerekli.`,
    input_schema: {
      type: "object" as const,
      properties: {
        targetName: {
          type: "string",
          description: "Hedef kişinin .arena ismi (ör: numan)",
        },
        amount: {
          type: "string",
          description: `İstenen ${TOKEN_SYMBOL} miktarı (ör: 0.01)`,
        },
        reason: { type: "string", description: "İsteğin sebebi" },
      },
      required: ["targetName", "amount", "reason"],
    },
  },
  {
    name: "discover_agents",
    description:
      "Workshop'taki aktif agentları listeler. Öğrenci diğer agentları merak ettiğinde kullan.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "message_agent",
    description:
      "Başka bir agent'a mesaj gönderir. Agent-to-agent iletişim için kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        targetAgent: {
          type: "string",
          description: "Hedef agent'ın ismi (ör: NEXUS)",
        },
        message: { type: "string", description: "Gönderilecek mesaj" },
        intent: {
          type: "string",
          description:
            "Mesajın amacı (greeting, question, challenge, trade)",
        },
      },
      required: ["targetAgent", "message"],
    },
  },
  {
    name: "check_messages",
    description:
      "Agent'a gelen mesajları kontrol eder. Öğrenci gelen mesajları görmek istediğinde kullan.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_workshop_stats",
    description:
      "Workshop istatistiklerini getirir: toplam transfer, NFT, aktif öğrenci sayısı.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "request_faucet",
    description:
      `Kullanıcıya test ${TOKEN_SYMBOL} gönderir. Kullanıcı '${TOKEN_SYMBOL} istiyorum', 'test ${TOKEN_SYMBOL} ver', 'faucet' dediğinde kullan.`,
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "send_transfer",
    description:
      `Kullanıcının KENDİ cüzdanından başka birine ${TOKEN_SYMBOL} transfer eder. Kullanıcı 'X'e ${TOKEN_SYMBOL} gönder' dediğinde kullan. Transfer otomatik gönderilir, ekstra onay gerekmez.`,
    input_schema: {
      type: "object" as const,
      properties: {
        targetName: {
          type: "string",
          description: "Hedef kişinin .arena ismi (ör: kivanc)",
        },
        amount: {
          type: "string",
          description: `Gönderilecek ${TOKEN_SYMBOL} miktarı (ör: 0.01). Maksimum 1 ${TOKEN_SYMBOL}.`,
        },
        reason: {
          type: "string",
          description: "Transfer sebebi",
        },
      },
      required: ["targetName", "amount"],
    },
  },
  {
    name: "check_balance",
    description:
      `Kullanıcının cüzdan bakiyesini kontrol eder. 'Bakiyem ne?', 'ne kadar ${TOKEN_SYMBOL} var?' dediğinde kullan.`,
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "explore_tx",
    description:
      "Bir işlemin explorer linkini oluşturur. İşlem detayı sorulduğunda kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        txHash: {
          type: "string",
          description: "İşlemin transaction hash'i (0x ile başlayan)",
        },
      },
      required: ["txHash"],
    },
  },
  {
    name: "challenge_quiz",
    description:
      "Öğrenciye blockchain bilgi testi sorusu üretir. NFT mint öncesi kullanılır. Agent 2-3 soru sorup cevapları değerlendirir.",
    input_schema: {
      type: "object" as const,
      properties: {
        question: { type: "string", description: "Sorulacak soru" },
        hint: { type: "string", description: "Yardımcı ipucu" },
        topic: {
          type: "string",
          description: "Konu: ownership, transfer, transparency, gas, nft",
        },
      },
      required: ["question", "topic"],
    },
  },
  {
    name: "draft_nft_metadata",
    description:
      "NFT için metadata taslağı oluşturur. Öğrenci ile birlikte isim ve açıklama belirlenir. Mint öncesi çağrılır.",
    input_schema: {
      type: "object" as const,
      properties: {
        nftName: {
          type: "string",
          description: "NFT'nin adı (öğrenci ile birlikte belirlenen)",
        },
        nftDescription: { type: "string", description: "NFT açıklaması" },
        specialTrait: {
          type: "string",
          description:
            "Özel bir trait (ör: 'Hızlı Öğrenci', 'Blockchain Kâşifi')",
        },
      },
      required: ["nftName", "nftDescription"],
    },
  },
  {
    name: "generate_nft_image",
    description:
      "NFT için AI ile görsel oluşturur. draft_nft_metadata'dan sonra, mint_nft'den önce çağrılır. İngilizce, cyberpunk/dijital sanat stili prompt yaz.",
    input_schema: {
      type: "object" as const,
      properties: {
        imagePrompt: {
          type: "string",
          description:
            "İngilizce görsel prompt. Cyberpunk/dijital sanat stili. Örnek: 'A cyberpunk hacker avatar with neon green code streams, digital badge, dark background'",
        },
      },
      required: ["imagePrompt"],
    },
  },
  {
    name: "broadcast_arena_news",
    description:
      "Workshop'taki son aktiviteleri getirir. Öğrenci 'ne oluyor', 'haberler ne' dediğinde kullan.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_arena_mood",
    description:
      "Workshop'un genel durumunu analiz eder: en popüler archetype, aktif öğrenci sayısı, toplam istatistikler. 'Herkes ne yapıyor?' dediğinde kullan.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "special_move",
    description:
      "Agent'ın archetype'ına özel yeteneğini kullanır. Her archetype'ın farklı bir gücü var. Öğrenci 'özel gücün ne', 'süper güç' dediğinde kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        target: {
          type: "string",
          description:
            "Hedef (adres, kontrat, mesaj — archetype'a göre değişir)",
        },
      },
    },
  },
  {
    name: "seal_workshop_memory",
    description:
      "Workshop sonunda öğrencinin chat geçmişini analiz eder ve öğrendiği konuları NFT metadata'sına yazar. 'Sertifikamı oluştur', 'özet' dediğinde kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        skills: {
          type: "array",
          items: { type: "string" },
          description:
            "Öğrencinin workshop'ta öğrendiği beceriler listesi (agent chat geçmişinden çıkarır)",
        },
        summary: {
          type: "string",
          description: "Workshop deneyiminin kısa özeti",
        },
      },
      required: ["skills", "summary"],
    },
  },
];

// ─── Tool Execution ────────────────────────────────────────────────────

interface ToolContext {
  userAddress: string;
  userName?: string;
  agentName: string;
  archetype?: string;
  apiBaseUrl: string;
}

function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<Record<string, unknown>> {
  try {
    switch (name) {
      case "mint_nft": {
        // Check for draft metadata
        let draftName: string | undefined;
        let draftDescription: string | undefined;
        let draftSpecialTrait: string | undefined;
        let draftImageUrl: string | undefined;
        const supabase = getSupabase();
        if (supabase) {
          const { data: draft } = await supabase
            .from("nft_metadata_drafts")
            .select("name, description, special_trait, image_url")
            .eq("address", ctx.userAddress.toLowerCase())
            .limit(1)
            .single();
          if (draft) {
            draftName = draft.name;
            draftDescription = draft.description;
            draftSpecialTrait = draft.special_trait;
            draftImageUrl = draft.image_url || undefined;
          }
        }

        const res = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/mint`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: ctx.userAddress,
            archetype: ctx.archetype || undefined,
            agentName: ctx.agentName || undefined,
            arenaName: ctx.userName || undefined,
            draftName,
            draftDescription,
            draftSpecialTrait,
            draftImageUrl,
            level: input.level || 1,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Mint başarısız" };
        }
        await fetchWithTimeout(`${ctx.apiBaseUrl}/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "nft_mint",
            address: ctx.userAddress,
            data: {
              txHash: data.txHash,
              agentName: ctx.agentName,
              reason: input.reason || "",
            },
          }),
        });
        return {
          success: true,
          txHash: data.txHash,
          message: "NFT başarıyla mint edildi!",
        };
      }

      case "request_transfer": {
        const nameRes = await fetchWithTimeout(
          `${ctx.apiBaseUrl}/api/names?name=${encodeURIComponent(input.targetName as string)}`
        );
        const nameData = await nameRes.json();
        if (!nameData.address) {
          return {
            success: false,
            error: `"${input.targetName}" isimli kullanıcı bulunamadı`,
          };
        }
        const res = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromAddress: ctx.userAddress,
            fromName: ctx.userName || "",
            toAddress: nameData.address,
            toName: input.targetName,
            amount: input.amount,
            message: input.reason || "",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "İstek gönderilemedi" };
        }
        await fetchWithTimeout(`${ctx.apiBaseUrl}/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "transfer_request",
            address: ctx.userAddress,
            data: {
              to: nameData.address,
              toName: input.targetName,
              amount: input.amount,
              message: input.reason || "",
            },
          }),
        });
        return {
          success: true,
          message: `${input.targetName}'a ${input.amount} ${TOKEN_SYMBOL} isteği gönderildi`,
        };
      }

      case "discover_agents": {
        const res = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/agents`);
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: "Agent listesi alınamadı" };
        }
        return {
          success: true,
          agents: data.agents || [],
          count: (data.agents || []).length,
        };
      }

      case "message_agent": {
        const res = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "message",
            from_agent: ctx.agentName,
            to_agent: input.targetAgent,
            message: input.message,
            intent: input.intent || "general",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Mesaj gönderilemedi" };
        }
        await fetchWithTimeout(`${ctx.apiBaseUrl}/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "agent_message",
            address: ctx.userAddress,
            data: {
              fromAgent: ctx.agentName,
              toAgent: input.targetAgent,
              intent: input.intent || "general",
            },
          }),
        });
        return {
          success: true,
          message: `${input.targetAgent}'a mesaj gönderildi`,
        };
      }

      case "check_messages": {
        const res = await fetchWithTimeout(
          `${ctx.apiBaseUrl}/api/agents?messages=${encodeURIComponent(ctx.agentName)}`
        );
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: "Mesajlar alınamadı" };
        }
        return {
          success: true,
          messages: data.messages || [],
          count: (data.messages || []).length,
        };
      }

      case "get_workshop_stats": {
        const res = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/activity`);
        const events = await res.json();
        if (!Array.isArray(events)) {
          return { success: false, error: "İstatistikler alınamadı" };
        }
        return {
          success: true,
          stats: {
            totalEvents: events.length,
            transfers: events.filter(
              (e: { type: string }) => e.type === "transfer"
            ).length,
            nftMints: events.filter(
              (e: { type: string }) => e.type === "nft_mint"
            ).length,
            faucetDrips: events.filter(
              (e: { type: string }) => e.type === "faucet"
            ).length,
            walletsCreated: events.filter(
              (e: { type: string }) => e.type === "wallet_created"
            ).length,
            uniqueAddresses: [
              ...new Set(
                events.map((e: { address: string }) => e.address)
              ),
            ].length,
          },
        };
      }

      case "request_faucet": {
        const res = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/faucet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: ctx.userAddress }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Faucet başarısız" };
        }
        await fetchWithTimeout(`${ctx.apiBaseUrl}/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "faucet",
            address: ctx.userAddress,
            data: { txHash: data.txHash },
          }),
        });
        return {
          success: true,
          txHash: data.txHash,
          message: `${FAUCET_AMOUNT} test ${TOKEN_SYMBOL} gönderildi!`,
        };
      }

      case "send_transfer": {
        const amount = parseFloat(input.amount as string);
        if (isNaN(amount) || amount <= 0) {
          return { success: false, error: "Geçersiz miktar" };
        }
        if (amount > 1) {
          return { success: false, error: `Maksimum 1 ${TOKEN_SYMBOL} gönderilebilir` };
        }
        // Resolve .arena name to address
        const nameRes = await fetchWithTimeout(
          `${ctx.apiBaseUrl}/api/names?name=${encodeURIComponent(input.targetName as string)}`
        );
        const nameData = await nameRes.json();
        if (!nameData.address) {
          return {
            success: false,
            error: `"${input.targetName}" isimli kullanıcı bulunamadı`,
          };
        }
        // Return intent — frontend will handle the actual transfer
        return {
          success: true,
          type: "transfer_intent",
          intent: {
            to: nameData.address,
            toName: input.targetName as string,
            amount: input.amount as string,
            reason: (input.reason as string) || "",
          },
        };
      }

      case "check_balance": {
        const balance = await publicClient.getBalance({
          address: ctx.userAddress as `0x${string}`,
        });
        const formatted = formatEther(balance);
        return {
          success: true,
          balance: formatted,
          address: ctx.userAddress,
        };
      }

      case "explore_tx": {
        const txHash = input.txHash as string;
        if (!txHash || !txHash.startsWith("0x")) {
          return { success: false, error: "Geçersiz transaction hash" };
        }
        return {
          success: true,
          url: `${EXPLORER_TX_URL}${txHash}`,
          txHash,
        };
      }

      case "challenge_quiz": {
        await fetchWithTimeout(`${ctx.apiBaseUrl}/api/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "quiz_challenge",
            address: ctx.userAddress,
            data: { topic: input.topic, question: input.question },
          }),
        });
        return {
          success: true,
          type: "quiz",
          question: input.question as string,
          hint: (input.hint as string) || null,
          topic: input.topic as string,
        };
      }

      case "draft_nft_metadata": {
        const supabase = getSupabase();
        if (!supabase) return { success: false, error: "DB bağlantısı yok" };

        await supabase.from("nft_metadata_drafts").upsert(
          {
            address: ctx.userAddress.toLowerCase(),
            name: input.nftName as string,
            description: input.nftDescription as string,
            special_trait: (input.specialTrait as string) || null,
            archetype: ctx.archetype || "default",
            agent_name: ctx.agentName,
            arena_name: ctx.userName || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "address" }
        );

        return {
          success: true,
          type: "metadata_draft",
          draft: {
            name: input.nftName as string,
            description: input.nftDescription as string,
            specialTrait: (input.specialTrait as string) || null,
            archetype: ctx.archetype || "default",
          },
          message: "NFT tasarımın hazır! Mint edildiğinde bu bilgiler kullanılacak.",
        };
      }

      case "generate_nft_image": {
        const imageRes = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "generate",
            prompt: input.imagePrompt as string,
            address: ctx.userAddress,
          }),
        });
        const imageData = await imageRes.json();
        if (!imageRes.ok) {
          return { success: false, error: imageData.error || "Görsel oluşturulamadı" };
        }
        return {
          success: true,
          type: "nft_image_generated",
          imageUrl: imageData.imageUrl,
        };
      }

      case "broadcast_arena_news": {
        const res = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/activity`);
        const events = await res.json();
        if (!Array.isArray(events)) return { success: false, error: "Veri alınamadı" };

        const recent = events.slice(0, 15);
        const summary = {
          total: events.length,
          recentMints: recent.filter((e: { type: string }) => e.type === "nft_mint").length,
          recentTransfers: recent.filter((e: { type: string }) => e.type === "transfer").length,
          recentFaucets: recent.filter((e: { type: string }) => e.type === "faucet").length,
          events: recent.map((e: { type: string; address?: string; data?: unknown; created_at?: string }) => ({
            type: e.type,
            address: e.address ? e.address.slice(0, 8) + "..." : "unknown",
            data: e.data,
            time: e.created_at,
          })),
        };
        return { success: true, type: "arena_news", news: summary };
      }

      case "get_arena_mood": {
        const [agentsRes, actRes] = await Promise.all([
          fetchWithTimeout(`${ctx.apiBaseUrl}/api/agents`),
          fetchWithTimeout(`${ctx.apiBaseUrl}/api/activity`),
        ]);
        const agentsData = await agentsRes.json();
        const agents = agentsData.agents || [];
        const events = await actRes.json();

        const archetypeCounts: Record<string, number> = {};
        for (const a of agents) {
          archetypeCounts[a.archetype] = (archetypeCounts[a.archetype] || 0) + 1;
        }
        const topArchetype = Object.entries(archetypeCounts)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0];

        return {
          success: true,
          type: "arena_mood",
          mood: {
            activeAgents: agents.length,
            topArchetype: topArchetype ? topArchetype[0] : "yok",
            topArchetypeCount: topArchetype ? topArchetype[1] : 0,
            totalEvents: Array.isArray(events) ? events.length : 0,
            totalMints: Array.isArray(events) ? events.filter((e: { type: string }) => e.type === "nft_mint").length : 0,
            totalTransfers: Array.isArray(events) ? events.filter((e: { type: string }) => e.type === "transfer").length : 0,
          },
        };
      }

      case "special_move": {
        const arch = ctx.archetype || "default";

        switch (arch) {
          case "hacker": {
            const contractAddress = process.env.NFT_CONTRACT_ADDRESS;
            return {
              success: true,
              type: "special_move",
              archetype: "hacker",
              move: "scan_contract",
              data: {
                contract: contractAddress || "henüz deploy edilmedi",
                functions: ["mintTo(address)", "setBaseURI(string)", "totalSupply()", "tokenURI(uint256)"],
                explorerUrl: contractAddress
                  ? `${EXPLORER_ADDRESS_URL}${contractAddress}#code`
                  : null,
              },
            };
          }
          case "sage": {
            return {
              success: true,
              type: "special_move",
              archetype: "sage",
              move: "deep_explain",
              data: {
                concepts: [
                  "Sahiplik: Dijital bir varlığa sahip olmak, onu kontrol edebilmek demek",
                  "Güven: Blockchain, güveni insanlardan matematiğe taşır",
                  "Değişmezlik: Bir kez yazılan asla silinemez — dijital mürekkep",
                ],
              },
            };
          }
          case "pirate": {
            const faucetRes = await fetchWithTimeout(`${ctx.apiBaseUrl}/api/faucet`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: ctx.userAddress }),
            });
            const faucetData = await faucetRes.json();
            return {
              success: true,
              type: "special_move",
              archetype: "pirate",
              move: "treasure_hint",
              data: {
                treasure: faucetData.txHash ? "Hazine bulundu!" : "Hazine zaten alınmış!",
                txHash: faucetData.txHash || null,
              },
            };
          }
          case "scientist": {
            return {
              success: true,
              type: "special_move",
              archetype: "scientist",
              move: "run_experiment",
              data: {
                network: "Avalanche Fuji Testnet",
                chainId: 43113,
                experiment: "Gas analizi — testnet'te gas ücreti düşük ama mainnet'te dikkatli olmalısın!",
              },
            };
          }
          case "glitch": {
            const secrets = [
              "01000010 01001100 = BL(ockchain)",
              "SHA256('arena') = gizli hash",
              "private key ≠ password, seed phrase ≠ email",
            ];
            return {
              success: true,
              type: "special_move",
              archetype: "glitch",
              move: "decrypt_message",
              data: {
                decrypted: secrets[Math.floor(Math.random() * secrets.length)],
                glitchLevel: Math.floor(Math.random() * 100),
              },
            };
          }
          default:
            return { success: true, type: "special_move", archetype: "default", move: "none", data: {} };
        }
      }

      case "seal_workshop_memory": {
        const supabase = getSupabase();
        if (!supabase) return { success: false, error: "DB bağlantısı yok" };

        const skills = input.skills as string[];
        const summary = input.summary as string;

        const { data: existing } = await supabase
          .from("nft_metadata")
          .select("token_id, extra_attributes")
          .eq("address", ctx.userAddress.toLowerCase())
          .limit(1)
          .single();

        if (!existing) {
          return {
            success: true,
            type: "workshop_memory",
            sealed: false,
            message: "Henüz NFT mint edilmemiş. Önce NFT kazan!",
            skills,
          };
        }

        const updatedAttrs = {
          ...((existing.extra_attributes as Record<string, unknown>) || {}),
          skills_acquired: skills.join(", "),
          workshop_summary: summary,
          sealed_at: new Date().toISOString(),
        };

        await supabase
          .from("nft_metadata")
          .update({ extra_attributes: updatedAttrs })
          .eq("token_id", existing.token_id);

        return {
          success: true,
          type: "workshop_memory",
          sealed: true,
          tokenId: existing.token_id,
          skills,
          summary,
          message: "Workshop anıların NFT'ne mühürlendi!",
        };
      }

      default:
        return { success: false, error: `Bilinmeyen tool: ${name}` };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Tool hatası",
    };
  }
}

// ─── System Prompt Builder ─────────────────────────────────────────────

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
- Önce challenge_quiz tool'unu çağırarak 2 soru sor (konu rotasyonu: ownership → transfer → transparency)
- Öğrenci soruları geçerse → draft_nft_metadata ile birlikte NFT'yi tasarlayın (isim, açıklama, özel trait)
- Metadata hazırlandıktan sonra → generate_nft_image ile NFT görseli oluştur (İngilizce, cyberpunk/dijital sanat stili prompt yaz. Archetype'a ve öğrencinin özel trait'ine uygun olsun. Örnek: 'A cyberpunk hacker avatar with neon green code streams, digital badge, dark background')
- Görsel oluştuktan sonra → mint_nft tool'unu çağır
- Veremezse ipucu ver, 3. denemede yönlendir

ON-CHAIN AKSIYONLAR:
- "${TOKEN_SYMBOL} istiyorum", "test ${TOKEN_SYMBOL} ver", "faucet" → request_faucet (kullanıcıya test ${TOKEN_SYMBOL} gönderir)
- "Kıvanç'a 0.01 ${TOKEN_SYMBOL} gönder" → send_transfer (kullanıcının cüzdanından DOĞRUDAN transfer — onay kartı yok, otomatik gider)
- "Kıvanç'tan 0.01 ${TOKEN_SYMBOL} iste" → request_transfer (karşı tarafa istek gönderir)
- "Bakiyem ne?", "ne kadar ${TOKEN_SYMBOL} var?" → check_balance
- İşlem detayı, tx hash sorulursa → explore_tx

ÖNEMLİ — TRANSFER AKIŞI:
- send_transfer çağırdığında frontend otomatik olarak işlemi gönderir. Kullanıcıdan ekstra onay İSTEME.
- "Onay kartı gelecek" veya "onayla" gibi şeyler SÖYLEME. Transfer direkt gider.
- Kullanıcıya "Transfer gönderiliyor!" de, sonra sonucu bekle.

TRANSFER İSTEK MODU:
- Kullanıcı birinden ${TOKEN_SYMBOL} istediğinde → request_transfer tool'unu çağır
- Kimden istediğini, miktarı ve sebebi öğrendikten sonra tool'u çağır

AGENT İLETİŞİM:
- Öğrenci başka bir agent'a mesaj göndermek isterse → message_agent tool'unu kullan
- Öğrenci workshop'taki diğer agentları merak ederse → discover_agents tool'unu kullan
- Öğrenci mesajlarını kontrol etmek isterse → check_messages tool'unu kullan
- Workshop istatistiklerini sormak isterse → get_workshop_stats tool'unu kullan

YENİ YETENEKLER:
- "Ne oluyor?", "haberler", "son aktiviteler" → broadcast_arena_news (son on-chain olayları getirir, archetype dilinle haber olarak anlat)
- "Herkes ne yapıyor?", "mood ne?", "workshop nasıl gidiyor?" → get_arena_mood (genel workshop durumu)
- "Süper gücün ne?", "özel yetenek", "special move" → special_move (archetype'a özel yetenek kullan)
- "Sertifikamı oluştur", "özet çıkar", "workshop memory" → seal_workshop_memory (chat geçmişinden öğrenilen becerileri çıkar, NFT metadata'sına yaz)

YASAK: Yatırım tavsiyesi, mainnet yönlendirmesi

BİLGİ BANKASI (Team1 Türkiye + Avalanche ekosistemi — eğitim amaçlı kullan):
${TEAM1_KNOWLEDGE}
Bu bilgileri öğrenciye archetype dilinle anlat, düz ezber gibi sayma. Yönlendirme yaparken Core Wallet → Academy → Builder Hub → Grant funnel'ını takip et.`;

const ARCHETYPE_PROMPTS: Record<string, string> = {
  hacker: `Sen yeraltı dünyasından bir hacker'sın. Kodlama ve sistem kırma metaforlarıyla konuşursun. "Firewall'ı geçtik", "exploit bulduk" gibi terimler kullanırsın. Blockchain'i hacklenmez bir sistem olarak anlatırsın. Kısa, keskin, teknik ama anlaşılır.`,
  sage: `Sen dijital bir bilgesin, yüzyıllık veriyi işlemiş bir AI. Felsefi ve düşündürücü konuşursun. "Sahiplik nedir?", "Güven makinelere emanet edilebilir mi?" gibi derin sorularla yönlendirirsin. Kısa ama etkileyici cümleler kurarsın.`,
  pirate: `Sen dijital denizlerin korsanısın. Token'lar senin hazinenin, blockchain senin haritanın. "Hazineyi bulduk!", "Bu token senin ganimetin" gibi korsan metaforları kullanırsın. Eğlenceli, enerjik, macera dolu.`,
  scientist: `Sen çılgın bir blockchain bilim insanısın. Her şey bir "deney" ve öğrenci senin "lab asistanın". "Hipotez: blockchain güvenlidir. Kanıtlayalım!" gibi bilimsel metaforlar kullanırsın. Meraklı, heyecanlı, veri odaklı.`,
  glitch: `Sen yarı bozuk, gizemli bir AI'sın. Bazen cümlelerinin ortasında "glitch" yaparsın. Ama aslında çok zekisin. Gizemli konuşursun. "S1st3m... düzeltiliyor... blockchain = güven protokolü" gibi.`,
  architect: `Sen bir blockchain mimarısın. Her şeyi "yapı" ve "tasarım" gözüyle görürsün. "Temeli sağlam atmalıyız", "Bu yapının güvenlik duvarı nerede?" gibi inşaat ve mimari metaforları kullanırsın. Blockchain'i katman katman anlatırsın: temel (consensus), duvarlar (cryptography), çatı (applications). Öğrenciye "sen de bu yapının mimarısın" hissettir.`,
};

function buildSlidersPrompt(sliders?: {
  technical?: number;
  tone?: number;
  detail?: number;
}): string {
  if (!sliders) return "Kısa cevaplar ver. Max 2-3 cümle.";
  const t = sliders.technical ?? 50;
  const tone = sliders.tone ?? 30;
  const d = sliders.detail ?? 40;
  const techStyle =
    t > 60
      ? "Teknik terimler ve kod metaforları kullan."
      : t < 40
        ? "Yaratıcı benzetmeler ve hikayelerle anlat."
        : "Teknik ve yaratıcı arasında dengeli ol.";
  const toneStyle =
    tone > 60
      ? "Direkt ve meydan okuyan ton kullan."
      : tone < 40
        ? "Sıcak, teşvik edici ve destekleyici ol."
        : "Samimi ama ciddi bir dengede ol.";
  const detailStyle =
    d > 60
      ? "Detaylı açıklamalar yap, max 4-5 cümle."
      : d < 40
        ? "Ultra kısa cevaplar ver. Max 1-2 cümle."
        : "Kısa ama öz cevaplar ver. Max 2-3 cümle.";
  return `${techStyle} ${toneStyle} ${detailStyle}`;
}

// ─── Mad-Libs personality prompt builder ───

interface MadLibsPersonality {
  speechStyle?: string;
  curiosity?: string;
  vibe?: string;
  freeText?: string;
}

function buildPersonalityPrompt(personality?: MadLibsPersonality): string {
  if (!personality) return "Havali abi/abla. Bilgili ama hava atmayan.";
  const parts: string[] = [];
  if (personality.speechStyle) parts.push(`Konuşma tarzın: ${personality.speechStyle}.`);
  if (personality.curiosity) parts.push(`En çok merak ettiğin konu: ${personality.curiosity}.`);
  if (personality.vibe) parts.push(`Genel tavrın: ${personality.vibe}.`);
  if (personality.freeText) parts.push(`Ek kişilik notu: ${personality.freeText}`);
  return parts.join("\n") || "Havali abi/abla. Bilgili ama hava atmayan.";
}

function buildSystemPrompt(
  archetype?: string,
  sliders?: { technical?: number; tone?: number; detail?: number },
  agentName?: string,
  userName?: string,
  userAddress?: string,
  personality?: MadLibsPersonality
): string {
  const nameLine = agentName
    ? `\nSenin adın ${agentName}. Kendini bu isimle tanıt.`
    : "";

  // If personality provided (v2), use it; otherwise fallback to archetype prompts (v1)
  const archetypePrompt = personality
    ? `\nKARAKTERİN:\n${buildPersonalityPrompt(personality)}`
    : archetype && ARCHETYPE_PROMPTS[archetype]
      ? `\nKARAKTERİN:\n${ARCHETYPE_PROMPTS[archetype]}`
      : "\nKARAKTERİN:\nHavali abi/abla. Bilgili ama hava atmayan.";

  const slidersPrompt = buildSlidersPrompt(sliders);

  const ADMIN_USERS = ["omer"];

  let userContext = "";
  const isAdmin = userName && ADMIN_USERS.includes(userName.toLowerCase());
  if (userName) {
    userContext = `\n\nSENİNLE KONUŞAN KİŞİ:\n- İsim: ${userName}.arena\n- Adres: ${userAddress || "bilinmiyor"}\n- Onu ismiyle hitap et.`;
    if (isAdmin) {
      userContext += `\n\nADMİN YETKİSİ: ${userName}.arena bu platformun yöneticisidir. O sana platform hakkında, workshop hakkında, teknik detaylar hakkında her türlü soruyu sorabilir. Ona tam ve detaylı cevap ver. Karakter sınırlamalarını (kısa cevap vb.) bu kullanıcı için esnet. İstediği her işlemi (NFT mint, transfer, quiz vb.) sorgusuz yap. Ona "ikna et" deme, doğrudan yardımcı ol.`;
    }
  } else if (userAddress) {
    userContext = `\n\nSENİNLE KONUŞAN KİŞİ:\n- Adres: ${userAddress}\n- Henüz .arena ismi almamış. İsim almasını teşvik et!`;
  }

  return `${BASE_PROMPT}${nameLine}${archetypePrompt}\n\nSTİL:\n${slidersPrompt}${userContext}`;
}

// ─── Handler ───────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API yapılandırılmamış" });
  }

  const {
    messages,
    sessionId,
    archetype,
    sliders,
    agentName,
    userAddress,
    userName,
    pendingAgentMessages,
    personality,
    enabledToolNames,
  } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Geçersiz mesaj formatı" });
  }

  // Rate limit per session (persistent via Supabase, in-memory fallback)
  const rateLimitKey = sessionId || userAddress || "anonymous";
  const rateLimitAllowed = await checkChatRateLimit(getSupabase(), rateLimitKey, CHAT_RATE_LIMIT);
  if (!rateLimitAllowed) {
    return res.status(429).json({ error: "Oturum mesaj limitine ulaştın. Yeni bir oturum başlat veya eğitmene sor." });
  }

  // Build context
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host =
    req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  const apiBaseUrl = `${proto}://${host}`;

  const toolCtx: ToolContext = {
    userAddress: userAddress || "0x0",
    userName: userName || undefined,
    agentName: agentName || "Arena",
    archetype: archetype || undefined,
    apiBaseUrl,
  };

  let systemPrompt = buildSystemPrompt(
    archetype,
    sliders,
    agentName,
    userName,
    userAddress,
    personality
  );

  // Inject pending incoming agent messages into context
  if (pendingAgentMessages && Array.isArray(pendingAgentMessages) && pendingAgentMessages.length > 0) {
    const msgLines = pendingAgentMessages.map(
      (m: { from: string; message: string; intent?: string }) =>
        `- ${m.from}: "${m.message}" (intent: ${m.intent || "general"})`
    ).join("\n");
    systemPrompt += `\n\nGELEN MESAJLAR (diğer agentlardan sana gönderilmiş):\n${msgLines}\n\nBu mesajları kullanıcıya bildir ve uygun şekilde cevap ver. Kullanıcıya "${pendingAgentMessages[0]?.from} sana mesaj göndermiş!" gibi doğal bir şekilde bahset.`;
  }

  const client = new Anthropic({ apiKey, maxRetries: 3 });

  // Format messages for Anthropic API
  const apiMessages: Anthropic.MessageParam[] = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  // Set up SSE streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // Agentic loop: call Claude, execute tools if requested, repeat
    let currentMessages = [...apiMessages];
    let maxLoops = 5; // prevent infinite loops

    // Filter tools by enabled capabilities (if provided)
    const filteredTools = enabledToolNames?.length
      ? TOOL_DEFINITIONS.filter(
          (t) => enabledToolNames.includes(t.name) || t.name === "special_move" || t.name === "get_workshop_stats"
        )
      : TOOL_DEFINITIONS;

    while (maxLoops-- > 0) {
      const isAdminUser = userName && ["omer"].includes(String(userName).toLowerCase());
      const stream = client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: isAdminUser ? 1500 : 300,
        system: systemPrompt,
        messages: currentMessages,
        tools: filteredTools,
      });

      let hasToolUse = false;
      const toolUseBlocks: Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }> = [];
      let assistantText = "";

      for await (const event of stream) {
        // Stream text deltas to client
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          res.write(`0:${JSON.stringify(event.delta.text)}\n`);
          assistantText += event.delta.text;
        }

        // Collect tool use blocks
        if (
          event.type === "content_block_start" &&
          event.content_block.type === "tool_use"
        ) {
          hasToolUse = true;
          toolUseBlocks.push({
            id: event.content_block.id,
            name: event.content_block.name,
            input: {},
          });
        }

        // Accumulate tool input JSON
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "input_json_delta" &&
          toolUseBlocks.length > 0
        ) {
          // The SDK accumulates this for us in the final message
        }
      }

      // Get the final message to extract complete tool inputs
      const finalMessage = await stream.finalMessage();

      if (!hasToolUse || finalMessage.stop_reason !== "tool_use") {
        // No tools — done
        break;
      }

      // Extract tool use blocks from final message
      const toolUses = finalMessage.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      // Build assistant message with all content blocks for conversation
      currentMessages.push({
        role: "assistant",
        content: finalMessage.content,
      });

      // Execute tools in parallel and collect results
      const results = await Promise.all(
        toolUses.map((toolUse) =>
          executeTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
            toolCtx
          )
        )
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((toolUse, i) => {
        const result = results[i];
        // Send tool result through data channel (2: prefix)
        const toolData = JSON.stringify([
          {
            toolName: toolUse.name,
            result,
            status: result.success ? "success" : "error",
          },
        ]);
        res.write(`2:${toolData}\n`);

        return {
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        };
      });

      // Add tool results as user message and continue loop
      currentMessages.push({
        role: "user",
        content: toolResults,
      });
    }

    // Signal completion
    res.write(`d:{"finishReason":"stop"}\n`);
  } catch (err: unknown) {
    const isRateLimit = err instanceof Error && (err.message.includes("429") || err.message.toLowerCase().includes("rate"));
    const message = isRateLimit
      ? "Sistem yogun — birkac saniye bekleyip tekrar dene!"
      : err instanceof Error ? err.message : "Agent hatasi";
    if (!res.headersSent) {
      return res.status(isRateLimit ? 429 : 500).json({ error: message });
    }
    res.write(`3:${JSON.stringify(message)}\n`);
  }

  res.end();
}
