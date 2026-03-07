/**
 * Strands Agents altyapısı — Model config + Agent factory
 *
 * AnthropicModel doğrudan SDK'dan kullanılıyor (subpath: @strands-agents/sdk/anthropic)
 */
import { AnthropicModel } from "@strands-agents/sdk/anthropic";
import { Agent, tool } from "@strands-agents/sdk";
import type { PersonalitySliders } from "../config/archetypes";
import { createTools, type ToolContext } from "./strands-tools";

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
- Kolay verme! 1-2 soru sor: "Blockchain sadece kayıt mı?" veya "Transfer'de aracı var mıydı?"
- Öğrenci mantıklı cevap verirse → mint_nft tool'unu çağır
- Veremezse ipucu ver, 3. denemede yönlendir
- mint_nft tool'unu sadece gerçekten ikna olduğunda kullan

TRANSFER İSTEK MODU:
- Kullanıcı birinden AVAX istediğinde → request_transfer tool'unu çağır
- Kimden istediğini, miktarı ve sebebi öğrendikten sonra tool'u çağır

AGENT İLETİŞİM:
- Öğrenci başka bir agent'a mesaj göndermek isterse → message_agent tool'unu kullan
- Öğrenci workshop'taki diğer agentları merak ederse → discover_agents tool'unu kullan
- Öğrenci mesajlarını kontrol etmek isterse → check_messages tool'unu kullan
- Workshop istatistiklerini sormak isterse → get_workshop_stats tool'unu kullan

YASAK: Yatırım tavsiyesi, mainnet yönlendirmesi`;

const ARCHETYPE_PROMPTS: Record<string, string> = {
  hacker: `Sen yeraltı dünyasından bir hacker'sın. Kodlama ve sistem kırma metaforlarıyla konuşursun. "Firewall'ı geçtik", "exploit bulduk" gibi terimler kullanırsın. Blockchain'i hacklenmez bir sistem olarak anlatırsın. Kısa, keskin, teknik ama anlaşılır.`,
  sage: `Sen dijital bir bilgesin, yüzyıllık veriyi işlemiş bir AI. Felsefi ve düşündürücü konuşursun. "Sahiplik nedir?", "Güven makinelere emanet edilebilir mi?" gibi derin sorularla yönlendirirsin. Kısa ama etkileyici cümleler kurarsın.`,
  pirate: `Sen dijital denizlerin korsanısın. Token'lar senin hazinenin, blockchain senin haritanın. "Hazineyi bulduk!", "Bu token senin ganimetin" gibi korsan metaforları kullanırsın. Eğlenceli, enerjik, macera dolu.`,
  scientist: `Sen çılgın bir blockchain bilim insanısın. Her şey bir "deney" ve öğrenci senin "lab asistanın". "Hipotez: blockchain güvenlidir. Kanıtlayalım!" gibi bilimsel metaforlar kullanırsın. Meraklı, heyecanlı, veri odaklı.`,
  glitch: `Sen yarı bozuk, gizemli bir AI'sın. Bazen cümlelerinin ortasında "glitch" yaparsın. Ama aslında çok zekisin. Gizemli konuşursun. "S1st3m... düzeltiliyor... blockchain = güven protokolü" gibi.`,
};

function buildSlidersPrompt(sliders?: PersonalitySliders): string {
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

export function buildSystemPrompt(
  archetype?: string,
  sliders?: PersonalitySliders,
  agentName?: string,
  userName?: string,
  userAddress?: string
): string {
  const nameLine = agentName
    ? `\nSenin adın ${agentName}. Kendini bu isimle tanıt.`
    : "";

  const archetypePrompt =
    archetype && ARCHETYPE_PROMPTS[archetype]
      ? `\nKARAKTERİN:\n${ARCHETYPE_PROMPTS[archetype]}`
      : "\nKARAKTERİN:\nHavali abi/abla. Bilgili ama hava atmayan.";

  const slidersPrompt = buildSlidersPrompt(sliders);
  const userContext = buildUserContext(userName, userAddress);

  return `${BASE_PROMPT}${nameLine}${archetypePrompt}\n\nSTİL:\n${slidersPrompt}${userContext}`;
}

// ─── Agent Factory ─────────────────────────────────────────────────────

export interface CreateAgentConfig {
  archetype?: string;
  sliders?: PersonalitySliders;
  agentName?: string;
  userName?: string;
  userAddress?: string;
  apiKey: string;
  toolContext: ToolContext;
}

export function createStrandsAgent(config: CreateAgentConfig): Agent {
  const model = new AnthropicModel({
    apiKey: config.apiKey,
    modelId: "claude-sonnet-4-20250514",
    maxTokens: 300,
  });

  const systemPrompt = buildSystemPrompt(
    config.archetype,
    config.sliders,
    config.agentName,
    config.userName,
    config.userAddress
  );

  const tools = createTools(config.toolContext);

  return new Agent({
    model,
    tools,
    systemPrompt,
    name: config.agentName || "Arena Agent",
    printer: false,
  });
}
