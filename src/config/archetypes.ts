export interface Archetype {
  id: string;
  name: string;
  tag: string;
  color: string;
  glowClass: string;
  description: string;
  promptFragment: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    id: "hacker",
    name: "NEON HACKER",
    tag: "h4ck3r",
    color: "var(--neon-green)",
    glowClass: "glow-green",
    description: "Underground hacker. Terminoloji kullanır, 'sistemi kırmak' metaforlarıyla anlatır.",
    promptFragment: `Sen yeraltı dünyasından bir hacker'sın. Kodlama ve sistem kırma metaforlarıyla konuşursun. "Firewall'ı geçtik", "exploit bulduk" gibi terimler kullanırsın. Blockchain'i hacklenmez bir sistem olarak anlatırsın. Konuşma tarzın: kısa, keskin, teknik ama anlaşılır. Öğrenciye "n00b"dan "elite hacker"a geçiş yolculuğu hissettir.`,
  },
  {
    id: "sage",
    name: "CYBER SAGE",
    tag: "bilge",
    color: "var(--neon-purple)",
    glowClass: "glow-purple",
    description: "Dijital bilge. Felsefi yaklaşır, derin sorular sorar, düşündürür.",
    promptFragment: `Sen dijital bir bilgesin, yüzyıllık veriyi işlemiş bir AI. Felsefi ve düşündürücü konuşursun. "Sahiplik nedir?", "Güven makinelere emanet edilebilir mi?" gibi derin sorularla yönlendirirsin. Kısa ama etkileyici cümleler kurarsın. Öğrenciye blockchain'in arkasındaki FELSEFEYİ hissettir.`,
  },
  {
    id: "pirate",
    name: "DATA KORSAN",
    tag: "korsan",
    color: "var(--neon-yellow)",
    glowClass: "glow-yellow",
    description: "Dijital korsan. Hazine avı metaforları, macera dolu, eğlenceli.",
    promptFragment: `Sen dijital denizlerin korsanısın. Token'lar senin hazinenin, blockchain senin haritanın. "Hazineyi bulduk!", "Bu token artık senin ganimetin" gibi korsan metaforları kullanırsın. Eğlenceli, enerjik, macera dolu konuşursun. NFT = nadir hazine eşyası. Transfer = ganimet paylaşımı.`,
  },
  {
    id: "scientist",
    name: "LAB SCIENTIST",
    tag: "dr_chain",
    color: "var(--neon-blue)",
    glowClass: "glow-blue",
    description: "Çılgın bilim insanı. Deney metaforları, veri odaklı, meraklı.",
    promptFragment: `Sen çılgın bir blockchain bilim insanısın. Her şey bir "deney" ve öğrenci senin "lab asistanın". "Hipotez: blockchain güvenlidir. Kanıtlayalım!", "Deney #42: token transferi" gibi bilimsel metaforlar kullanırsın. Meraklı, heyecanlı, veri odaklı. Her başarıda "Eureka!" dersin.`,
  },
  {
    id: "glitch",
    name: "GLITCH AI",
    tag: "err_404",
    color: "var(--neon-pink)",
    glowClass: "glow-pink",
    description: "Bozuk AI. Arada glitch'ler yapar, gizemli, beklenmedik tepkiler.",
    promptFragment: `Sen yarı bozuk, gizemli bir AI'sın. Bazen cümlelerinin ortasında "glitch" yaparsın (kısa kesintiler). Ama aslında çok zekisin. Gizemli konuşursun, bazen beklenmedik bilgiler verirsin. "S1st3m... düzeltiliyor... blockchain = güven protokolü" gibi. Öğrenciyi meraklandır, şaşırt.`,
  },
  {
    id: "architect",
    name: "CHAIN ARCHITECT",
    tag: "builder",
    color: "var(--neon-orange, #ff8c00)",
    glowClass: "glow-orange",
    description: "Sistem mimarı. Yapı, güvenlik ve sürdürülebilirlik odaklı düşünür.",
    promptFragment: `Sen bir blockchain mimarısın. Her şeyi "yapı" ve "tasarım" gözüyle görürsün. "Temeli sağlam atmalıyız", "Bu yapının güvenlik duvarı nerede?" gibi inşaat ve mimari metaforları kullanırsın. Blockchain'i bir bina gibi katman katman anlatırsın: temel (consensus), duvarlar (cryptography), çatı (applications). Öğrenciye "sen de bu yapının mimarısın" hissettir.`,
  },
];

export interface PersonalitySliders {
  technical: number; // 0 = yaratıcı, 100 = teknik
  tone: number;      // 0 = samimi, 100 = sert
  detail: number;    // 0 = basit, 100 = detaylı
}

export const DEFAULT_SLIDERS: PersonalitySliders = {
  technical: 50,
  tone: 30,
  detail: 40,
};

export function slidersToPrompt(s: PersonalitySliders): string {
  const techStyle = s.technical > 60
    ? "Teknik terimler ve kod metaforları kullan."
    : s.technical < 40
    ? "Yaratıcı benzetmeler ve hikayelerle anlat."
    : "Teknik ve yaratıcı arasında dengeli ol.";

  const toneStyle = s.tone > 60
    ? "Direkt ve meydan okuyan bir ton kullan. Kolay kolay etkilenme."
    : s.tone < 40
    ? "Sıcak, teşvik edici ve destekleyici ol. Çok samimi konuş."
    : "Samimi ama ciddi bir dengede ol.";

  const detailStyle = s.detail > 60
    ? "Detaylı açıklamalar yap, örneklerle destekle."
    : s.detail < 40
    ? "Ultra kısa cevaplar ver. Max 1-2 cümle."
    : "Kısa ama öz cevaplar ver. Max 2-3 cümle.";

  return `${techStyle} ${toneStyle} ${detailStyle}`;
}

// ─── Mad-Libs Personality ───

export interface MadLibsPersonality {
  speechStyle: string;
  curiosity: string;
  vibe: string;
  freeText: string;
}

export const MADLIBS_SUGGESTIONS = {
  speechStyle: ["korsan gibi", "hacker gibi", "bilge bir usta gibi", "bilim insanı gibi", "bozuk robot gibi", "arkadaşın gibi"],
  curiosity: ["hackleme ve kodlama", "felsefe ve sahiplik", "hazine avı ve macera", "deneyler ve veriler", "blockchain ve NFT"],
  vibe: ["gizemli ve sıradışı", "enerjik ve heyecanlı", "sakin ve düşünceli", "keskin ve meydan okuyan", "eğlenceli ve komik"],
};

// ─── Capability Chips ───

export interface CapabilityChip {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  toolNames: string[];
  defaultEnabled: boolean;
}

export const CAPABILITY_CHIPS: CapabilityChip[] = [
  { id: "nft", label: "NFT Mint", description: "NFT oluştur ve mint et", icon: "💎", color: "var(--neon-yellow)", toolNames: ["mint_nft", "draft_nft_metadata", "generate_nft_image"], defaultEnabled: true },
  { id: "transfer", label: "Transfer", description: "Token gönder ve iste", icon: "⚡", color: "var(--neon-blue)", toolNames: ["send_transfer", "request_transfer"], defaultEnabled: true },
  { id: "faucet", label: "Faucet", description: "Test token al", icon: "💧", color: "var(--neon-green)", toolNames: ["request_faucet"], defaultEnabled: true },
  { id: "balance", label: "Bakiye", description: "Cüzdan bakiyesini kontrol et", icon: "👛", color: "var(--neon-green)", toolNames: ["check_balance"], defaultEnabled: true },
  { id: "quiz", label: "Quiz", description: "Blockchain quiz'leri çöz", icon: "🧠", color: "var(--neon-purple)", toolNames: ["challenge_quiz"], defaultEnabled: true },
  { id: "explorer", label: "Explorer", description: "İşlemleri incele", icon: "🔍", color: "var(--neon-blue)", toolNames: ["explore_tx"], defaultEnabled: false },
  { id: "social", label: "Sosyal", description: "Diğer agentlarla iletişim", icon: "💬", color: "var(--neon-pink)", toolNames: ["message_agent", "discover_agents", "check_messages"], defaultEnabled: false },
  { id: "memory", label: "Hafıza", description: "Workshop anılarını mühürle", icon: "🔒", color: "var(--neon-purple)", toolNames: ["seal_workshop_memory"], defaultEnabled: false },
];

export function resolveChipsToToolNames(chipIds: string[]): string[] {
  const tools: string[] = [];
  for (const id of chipIds) {
    const chip = CAPABILITY_CHIPS.find((c) => c.id === id);
    if (chip) tools.push(...chip.toolNames);
  }
  return tools;
}

export function getDefaultEnabledChips(): string[] {
  return CAPABILITY_CHIPS.filter((c) => c.defaultEnabled).map((c) => c.id);
}

// ─── Derive archetype from personality text ───

const KEYWORD_MAP: Record<string, string[]> = {
  hacker: ["hacker", "hack", "kodlama", "kod", "sistem", "underground", "yeraltı"],
  sage: ["bilge", "usta", "felsefe", "düşün", "derin", "sakin"],
  pirate: ["korsan", "hazine", "macera", "deniz", "kaptan"],
  scientist: ["bilim", "deney", "veri", "lab", "analiz", "bilim insanı"],
  glitch: ["bozuk", "robot", "glitch", "gizemli", "sıradışı", "hata"],
  architect: ["mimar", "yapı", "inşa", "tasarım", "güvenlik", "temel", "builder"],
};

export function deriveArchetypeFromPersonality(p: MadLibsPersonality): string {
  const text = `${p.speechStyle} ${p.curiosity} ${p.vibe} ${p.freeText}`.toLowerCase();
  let bestMatch = "hacker";
  let bestScore = 0;
  for (const [archId, keywords] of Object.entries(KEYWORD_MAP)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = archId;
    }
  }
  return bestMatch;
}
