/**
 * Strands Agent Tool Definitions — 6 typed tools
 *
 * Tag-based yaklaşım ([MINT_APPROVED], [REQUEST_ETH]) yerine
 * gerçek tool calls kullanıyor.
 */
import { tool } from "@strands-agents/sdk";
import type { JSONValue } from "@strands-agents/sdk";
import { z } from "zod";

/** Tool callback'lerin kullanacağı context */
export interface ToolContext {
  userAddress: string;
  userName?: string;
  agentName: string;
  /** Internal API base URL (Edge Functions) */
  apiBaseUrl: string;
}

/**
 * Tool factory — context inject edilerek tool'lar oluşturulur.
 */
export function createTools(ctx: ToolContext) {
  // ─── 1. mint_nft ─────────────────────────────────────────────────────
  const mint_nft = tool({
    name: "mint_nft",
    description:
      "Öğrenci agent'ı ikna ettiğinde NFT mint eder. Sadece öğrenci blockchain bilgisini kanıtladığında kullan.",
    inputSchema: z.object({
      reason: z
        .string()
        .describe("Öğrencinin neden NFT hak ettiğinin kısa açıklaması"),
    }),
    callback: async (input): Promise<JSONValue> => {
      const res = await fetch(`${ctx.apiBaseUrl}/api/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: ctx.userAddress }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Mint başarısız" };
      }

      // Post activity
      await fetch(`${ctx.apiBaseUrl}/api/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "nft_mint",
          address: ctx.userAddress,
          data: {
            txHash: data.txHash,
            agentName: ctx.agentName,
            reason: input.reason,
          },
        }),
      });

      return {
        success: true,
        txHash: data.txHash as string,
        message: "NFT başarıyla mint edildi!",
      };
    },
  });

  // ─── 2. request_transfer ─────────────────────────────────────────────
  const request_transfer = tool({
    name: "request_transfer",
    description:
      "Başka bir öğrenciden ETH transfer isteği gönderir. Hedef kişinin .arena ismi, miktar ve sebep gerekli.",
    inputSchema: z.object({
      targetName: z.string().describe("Hedef kişinin .arena ismi (ör: numan)"),
      amount: z.string().describe("İstenen ETH miktarı (ör: 0.01)"),
      reason: z.string().describe("İsteğin sebebi"),
    }),
    callback: async (input): Promise<JSONValue> => {
      // Resolve target name to address
      const nameRes = await fetch(
        `${ctx.apiBaseUrl}/api/names?name=${encodeURIComponent(input.targetName)}`
      );
      const nameData = await nameRes.json();
      if (!nameData.address) {
        return {
          success: false,
          error: `"${input.targetName}" isimli kullanıcı bulunamadı`,
        };
      }

      // Create transfer request
      const res = await fetch(`${ctx.apiBaseUrl}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_address: ctx.userAddress,
          from_name: ctx.userName || "",
          to_address: nameData.address,
          to_name: input.targetName,
          amount: input.amount,
          message: input.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "İstek gönderilemedi" };
      }

      // Post activity
      await fetch(`${ctx.apiBaseUrl}/api/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer_request",
          address: ctx.userAddress,
          data: {
            to: nameData.address,
            toName: input.targetName,
            amount: input.amount,
            message: input.reason,
          },
        }),
      });

      return {
        success: true,
        message: `${input.targetName}'a ${input.amount} ETH isteği gönderildi`,
      };
    },
  });

  // ─── 3. discover_agents ──────────────────────────────────────────────
  const discover_agents = tool({
    name: "discover_agents",
    description:
      "Workshop'taki aktif agentları listeler. Öğrenci diğer agentları merak ettiğinde kullan.",
    callback: async (): Promise<JSONValue> => {
      const res = await fetch(`${ctx.apiBaseUrl}/api/agents`);
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: "Agent listesi alınamadı" };
      }
      return {
        success: true,
        agents: data.agents || [],
        count: (data.agents || []).length,
      };
    },
  });

  // ─── 4. message_agent ────────────────────────────────────────────────
  const message_agent = tool({
    name: "message_agent",
    description:
      "Başka bir agent'a mesaj gönderir. Agent-to-agent iletişim için kullan.",
    inputSchema: z.object({
      targetAgent: z
        .string()
        .describe("Hedef agent'ın ismi (ör: NEXUS)"),
      message: z.string().describe("Gönderilecek mesaj"),
      intent: z
        .string()
        .optional()
        .describe("Mesajın amacı (greeting, question, challenge, trade)"),
    }),
    callback: async (input): Promise<JSONValue> => {
      const res = await fetch(`${ctx.apiBaseUrl}/api/agents`, {
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

      // Post activity
      await fetch(`${ctx.apiBaseUrl}/api/activity`, {
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
    },
  });

  // ─── 5. check_messages ───────────────────────────────────────────────
  const check_messages = tool({
    name: "check_messages",
    description:
      "Agent'a gelen mesajları kontrol eder. Öğrenci gelen mesajları görmek istediğinde kullan.",
    callback: async (): Promise<JSONValue> => {
      const res = await fetch(
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
    },
  });

  // ─── 6. get_workshop_stats ───────────────────────────────────────────
  const get_workshop_stats = tool({
    name: "get_workshop_stats",
    description:
      "Workshop istatistiklerini getirir: toplam transfer, NFT, aktif öğrenci sayısı.",
    callback: async (): Promise<JSONValue> => {
      const res = await fetch(`${ctx.apiBaseUrl}/api/activity`);
      const events = await res.json();
      if (!Array.isArray(events)) {
        return { success: false, error: "İstatistikler alınamadı" };
      }

      const stats = {
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
          ...new Set(events.map((e: { address: string }) => e.address)),
        ].length,
      };

      return { success: true, stats };
    },
  });

  return [
    mint_nft,
    request_transfer,
    discover_agents,
    message_agent,
    check_messages,
    get_workshop_stats,
  ];
}
