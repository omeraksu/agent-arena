# Agent Arena — AI Agent Sistemi

## Mimari Genel Bakis

Agent sistemi Anthropic SDK native tool calling + agentic loop kullanir. Her kullanici mesaji `POST /api/agent` endpoint'ine gider, Claude Sonnet 4 modeline iletilir ve SSE stream olarak doner. Claude, 16 tool'dan herhangi birini cagirabilir; tool sonuclari conversation'a eklenir ve max 5 iterasyon boyunca dongu devam eder.

```
Frontend (AgentChat.tsx)            Backend (api/agent.ts)              Dis Servisler
─────────────────────               ──────────────────────              ──────────────
useChat() POST /api/agent ──────▶  Rate limit kontrolu
                                    │
                                    ▼
                                    System prompt olustur
                                    (BASE + archetype + sliders + user context)
                                    │
                                    ▼
                              ┌──── Claude API stream ◀──── Anthropic API
                              │     │
                              │     ├─ text delta → SSE 0:
                              │     │
                              │     └─ tool_use?
                              │         ├─ Promise.all(tool1, tool2...)
                              │         ├─ tool results → SSE 2:
                              │         └─ conversation'a ekle, donguye don
                              │
                              └──── max 5 iterasyon
                                    │
                                    ▼
                                    SSE d: finish ──────────▶  Frontend UI guncelle
```

## System Prompt Yapisi

`buildSystemPrompt()` fonksiyonu (`api/agent.ts`) dinamik olarak system prompt'u olusturur:

```
┌─────────────────────────────────────────────────────────┐
│ BASE_PROMPT                                              │
│ - Temel kisilik (Turkce, samimi, 1 emoji max)           │
│ - Pazarlici ajan modu (quiz → draft → image → mint)     │
│ - On-chain aksiyon yonlendirme                          │
│ - Blockchain bilgi bankasi (2026 gunceli)               │
├─────────────────────────────────────────────────────────┤
│ + nameLine: "Senin ajaninin adi: {agentName}"           │
├─────────────────────────────────────────────────────────┤
│ + archetypePrompt (v2: MadLibs | v1: archetype)         │
│   "Konusma tarzi: korsan gibi, Merak alani: hackleme"   │
├─────────────────────────────────────────────────────────┤
│ + slidersPrompt                                          │
│   "Tekniklik: 70/100, Ton: 40/100, Detay: 50/100"      │
├─────────────────────────────────────────────────────────┤
│ + userContext                                            │
│   "Kullanicinin .arena ismi: kivanc.arena"              │
│   "Kullanicinin adresi: 0x..."                          │
│   "Admin kullanici: evet/hayir"                         │
├─────────────────────────────────────────────────────────┤
│ + [opsiyonel] pendingAgentMessages                       │
│   "Sana gelen mesajlar: X agent'indan: ..."             │
└─────────────────────────────────────────────────────────┘
```

### BASE_PROMPT Kapsami

- **Kisilik:** Turkce konusan, samimi, tesvik edici ama havali abi/abla figuru
- **Pazarlici modu:** NFT icin ogrenciyi test et (blockchain bilgisi), ikna olunca `draft_nft_metadata` → `generate_nft_image` → `mint_nft` sirasi
- **Bilgi bankasi:** Gas ucretleri (2026), ERC-20/721/8004, EIP-7702, x402 protokolu, L2'ler
- **Kural:** Max 3-4 cumle, 1-2 emoji, testnet vurgusu, gercek yatirim tavsiyesi yok

### Admin Bypass

```typescript
const ADMIN_USERS = ["omer"];
```

Admin kullanici:
- `max_tokens: 1500` (diger kullanicilar: 300)
- NFT quiz kapisi yok — dogrudan mint yapabilir
- Tum tool'lara erisim

## 6 Archetype

| ID | Isim | Renk | Tag | Prompt Ozeti |
|---|---|---|---|---|
| `hacker` | NEON HACKER | `--neon-green` | h4ck3r | Underground hacker metaforlari, "exploit", "firewall" |
| `sage` | CYBER SAGE | `--neon-purple` | bilge | Felsefi, "Sahiplik ne demek?", kisa etkili cumleler |
| `pirate` | DATA KORSAN | `--neon-yellow` | korsan | Hazine avi metaforlari, enerjik macera |
| `scientist` | LAB SCIENTIST | `--neon-blue` | dr_chain | Deney cercevesi, "Hipotez: blockchain guvenli. Kanit?" |
| `glitch` | GLITCH AI | `--neon-pink` | err_404 | Yari-bozuk AI, kasitli glitch pattern'leri |
| `architect` | CHAIN ARCHITECT | `--neon-orange` | builder | Insaat/katmanli mimari metaforlari |

Her archetype icin `ARCHETYPE_PROMPTS` (`api/agent.ts`) Claude'a enjekte edilen kisilik prompt parcasi icerir.

## Kisilik Sistemi

### v1 (Legacy) — Slider Tabanli

```typescript
interface PersonalitySliders {
  technical: number;  // 0=yaratici metaforlar, 100=teknik terimler
  tone: number;       // 0=sicak/destekleyici, 100=direkt/zorlayici
  detail: number;     // 0=ultra kisa 1-2 cumle, 100=detayli 4-5 cumle
}
// Varsayilan: { technical: 50, tone: 30, detail: 40 }
```

### v2 (Guncel) — Mad-Libs Tabanli

```typescript
interface MadLibsPersonality {
  speechStyle: string;   // "korsan gibi" | "hacker gibi" | "bilge bir usta gibi"
  curiosity: string;     // "hackleme ve kodlama" | "felsefe ve sahiplik"
  vibe: string;          // "gizemli ve siradisi" | "enerjik ve heyecanli"
  freeText: string;      // Serbest ek kisilik notu
}
```

Archetype otomatik turetilir: `deriveArchetypeFromPersonality()` keyword eslestirme kullanir:

```typescript
const KEYWORD_MAP: Record<string, string[]> = {
  hacker:    ["hacker", "hack", "kodlama", "kod", "sistem", "underground"],
  sage:      ["bilge", "usta", "felsefe", "derin", "sakin"],
  pirate:    ["korsan", "hazine", "macera", "deniz", "kaptan"],
  scientist: ["bilim", "deney", "veri", "lab", "analiz"],
  glitch:    ["bozuk", "robot", "glitch", "gizemli", "hata"],
  architect: ["mimar", "yapi", "insa", "tasarim", "guvenlik", "builder"],
};
```

Her keyword 1 puan, en yuksek puan alan archetype secilir.

## 16 Tool Detaylari

### On-Chain Tool'lar

#### `mint_nft`

NFT mint islemini tetikler. Once `nft_metadata_drafts`'tan taslak okur, sonra `/api/mint`'e POST atar.

```typescript
// Input
{ address: string; level?: number }  // level: 1|2|3 ikna kalitesi

// Side Effect
// 1. Supabase nft_metadata_drafts → oku
// 2. POST /api/mint → on-chain mintTo() veya simulated
// 3. POST /api/activity (nft_mint event)
```

#### `request_faucet`

Test AVAX talep eder.

```typescript
// Input
{ address: string }

// Side Effect
// POST /api/faucet → 0.005 AVAX on-chain transfer
```

#### `send_transfer`

Kullanicinin cuzdanindan transfer yapar. Backend sadece isim cozer ve intent dondutur; gercek TX frontend'de calisir.

```typescript
// Input
{ toNameOrAddress: string; amount: string; reason?: string }

// Output (frontend'e)
{ type: "transfer_intent", intent: { to, toName, amount, reason } }

// Frontend: thirdweb prepareTransaction + sendTransaction
```

**Transfer siniri:** `amount > 1 AVAX` reddedilir.

#### `check_balance`

```typescript
// Input
{ address: string }

// Output
{ balance: string; formatted: string; symbol: "AVAX" }
// publicClient.getBalance() — dogrudan Fuji RPC
```

#### `explore_tx`

```typescript
// Input
{ txHash: string }

// Output
{ url: "https://testnet.snowtrace.io/tx/<hash>" }
```

### Metadata Tool'lari

#### `draft_nft_metadata`

Agent chat sirasinda interaktif NFT tasarimi yapar.

```typescript
// Input
{ address: string; name: string; description: string; special_trait?: string }

// Side Effect
// Supabase nft_metadata_drafts upsert
```

#### `generate_nft_image`

Gemini ile NFT gorseli uretir.

```typescript
// Input
{ address: string; prompt: string }

// Side Effect
// POST /api/generate-image → Gemini API → Supabase Storage
// nft_metadata_drafts.image_url guncellenir
```

#### `seal_workshop_memory`

Workshop sonunda becerileri NFT metadata'sina kaydeder.

```typescript
// Input
{ address: string; skills_acquired: string[]; workshop_summary: string }

// Side Effect
// nft_metadata.extra_attributes guncellenir
```

### Sosyal Tool'lar

#### `discover_agents`

```typescript
// Input: {} (yok)
// Output: { agents: AgentRecord[] }
// GET /api/agents
```

#### `message_agent`

```typescript
// Input
{ to_agent: string; message: string; intent?: string }

// Side Effect
// POST /api/agents (action: message)
```

#### `check_messages`

```typescript
// Input
{ agent_name: string }
// Output: { messages: AgentMessage[] }
// GET /api/agents?messages=<name>
```

#### `request_transfer`

Baska bir ogrenciden AVAX transfer talebi olusturur.

```typescript
// Input
{ toNameOrAddress: string; amount: string; message?: string }

// Side Effect
// .arena isim cozumlemesi + POST /api/requests
```

### Bilgi Tool'lari

#### `get_workshop_stats`

```typescript
// Output
{ total_events, transfers, mints, agents, ... }
// GET /api/activity → aggregate
```

#### `broadcast_arena_news`

```typescript
// Output: son 15 event ozeti
// GET /api/activity
```

#### `get_arena_mood`

```typescript
// Output: archetype dagilimi + aktivite istatistikleri
// GET /api/agents + GET /api/activity (paralel)
```

#### `challenge_quiz`

```typescript
// Input
{ topic?: string }

// Output
{ question, hint, topic }
// quiz_challenge activity event kaydeder
```

#### `special_move`

Archetype'a ozel aksiyon. Her archetype farkli seyler yapar (bkz. Archetype tablosu).

## SSE Stream Formati

Vercel AI SDK `useChat` protokolu:

```
0:"Merhaba! "
0:"Ben senin "
0:"agent'in."
2:[{"toolName":"check_balance","result":{"balance":"0.005","symbol":"AVAX"},"status":"success"}]
0:" Bakiyen "
0:"0.005 AVAX."
d:{"finishReason":"stop"}
```

| Prefix | Icerik |
|---|---|
| `0:` | Text delta (JSON string) |
| `2:` | Tool result (JSON array: `[{toolName, result, status}]`) |
| `3:` | Hata mesaji (JSON string) |
| `d:` | Bitis sentinel (`{"finishReason":"stop"}`) |

## Frontend Entegrasyonu

### `useChat` (Vercel AI SDK)

`AgentChat.tsx` Vercel AI SDK'nin `useChat` hook'unu kullanir:

```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
  api: "/api/agent",
  body: {
    sessionId,
    archetype: archetype?.id,
    sliders,
    agentName,
    userAddress: account?.address,
    userName,
    personality,
    enabledToolNames: resolveChipsToToolNames(enabledChips),
    pendingAgentMessages: incomingMessages,
  },
});
```

### Tool Result Isleme

Tool sonuclari `data` channel'indan gelir (SSE `2:` prefix). Her tool icin gorunur ilerleme adimlari:

```typescript
const TOOL_PROGRESS_STAGES: Record<string, string[]> = {
  mint_nft:           ["connecting", "verifying", "minting", "confirming"],
  generate_nft_image: ["initializing_ai", "generating", "uploading"],
  request_faucet:     ["connecting", "sending"],
  send_transfer:      ["resolving", "preparing", "broadcasting"],
  check_balance:      ["querying_chain"],
  draft_nft_metadata: ["drafting", "compiling"],
  special_move:       ["charging", "executing"],
  // ...
};
```

### Transfer Intent Akisi

`send_transfer` tool'u `transfer_intent` dondurunce:

1. Backend: `{ type: "transfer_intent", intent: { to, toName, amount, reason } }`
2. Frontend: `transferStatus: "confirming"` state
3. Otomatik execute: thirdweb `prepareTransaction` + `sendTransaction`
4. Basarili TX → `/api/activity` event

### Quick Reply Chip'leri

Baglama gore degisen hizli yanit onerileri:

| Baglam | Chip'ler |
|---|---|
| Quiz sonrasi | "Cevabim hazir", "Ipucu ver" |
| Draft sonrasi | "Gorseli olustur", "Mint et" |
| Mint sonrasi | "Profilime bak", "Baska ne yapabilirim?" |
| Varsayilan | "NFT istiyorum", "Ne yapabilirim?", "Workshop istatistikleri" |

### Archetype Typing Indicator'lari

Her archetype benzersiz animasyonlu yazma gostergesi:

| Archetype | Typing Pattern |
|---|---|
| `hacker` | `d3crypt1ng_<random hex>` |
| `sage` | `contemplating....` |
| `pirate` | `scanning_seas_~~~` |
| `scientist` | Canli bar chart animasyonu |
| `glitch` | `pr0c3ss█ng_` |
| `architect` | `building_L0_layer` → L0-L3 dongusu |

## 5 Adimli Agent Builder

AgentChat icinde entegre agent olusturma akisi:

| Adim | Baslik | Icerik |
|---|---|---|
| 0 | Ghost Awakening | Terminal boot animasyonu |
| 1 | Agent Naming | Isim girisi (max 16 karakter, A-Z0-9_). Oneriler: CIPHER, NEXUS, PHANTOM... |
| 2 | Personality (Mad-Libs) | `speechStyle`, `curiosity`, `vibe`, `freeText` alanlari, oneri chip'leri |
| 3 | Capability Chips | Hangi tool'larin aktif olacagini sec |
| 4 | Compile & Deploy | Animasyonlu terminal derleme ekrani |

## Capability Chip Sistemi

8 chip, her biri belirli tool'lara eslesir:

| Chip ID | Tool'lar | Varsayilan |
|---|---|---|
| `nft` | `mint_nft`, `draft_nft_metadata`, `generate_nft_image` | Aktif |
| `transfer` | `send_transfer`, `request_transfer` | Aktif |
| `faucet` | `request_faucet` | Aktif |
| `balance` | `check_balance` | Aktif |
| `quiz` | `challenge_quiz` | Aktif |
| `explorer` | `explore_tx` | Pasif |
| `social` | `message_agent`, `discover_agents`, `check_messages` | Pasif |
| `memory` | `seal_workshop_memory` | Pasif |

`special_move` ve `get_workshop_stats` her zaman aktiftir (filtreden muaf).

## Gorsel Agent Builder (ReactFlow)

`src/components/builder/` altinda ReactFlow tabanli drag-and-drop arayuz:

| Dosya | Gorev |
|---|---|
| `AgentBuilder.tsx` | Root, `ReactFlowProvider`, yeniden boyutlanabilir palette |
| `BuilderCanvas.tsx` | ReactFlow canvas, ozel node/edge tipleri |
| `BuilderPalette.tsx` | Sol sidebar — archetype secimi + capability toggle |
| `BuilderTopBar.tsx` | Mod degistirme (basit/gelismis), compile butonu |
| `useBuilderState.ts` | Merkezi state — node'lar, edge'ler, mod, compile |
| `compileConfig.ts` | Node + edge'lerden v2 `AgentConfig` cikar |

**Node tipleri:** `IdentityNode` (isim), `ArchetypeNode` (archetype secimi), `CapabilityNode` (tool toggle)

**Compile:** Node'lar + baglantlar → `AgentConfig` (v2 format) → AgentChat'e aktarilir

## Strands SDK (Legacy)

`src/lib/strands.ts` ve `src/lib/strands-tools.ts` dosyalari `@strands-agents/sdk` kullanir:

- 6 tool tanimi: `mint_nft`, `request_transfer`, `discover_agents`, `message_agent`, `check_messages`, `get_workshop_stats`
- `createStrandsAgent()` factory fonksiyonu
- **Artik kullanilmiyor** — native Anthropic tool calling yaklasimi ile degistirildi (`api/agent.ts`)
- Kodda import edilmiyor; referans olarak saklanmis

## Guvenlik

| Mekanizma | Konum | Detay |
|---|---|---|
| Chat rate limiting | `api/agent.ts` | `BoundedMap(500)`, max 60 mesaj/session |
| API key izolasyonu | `api/agent.ts` | `ANTHROPIC_API_KEY` sadece backend'de |
| Transfer siniri | `api/agent.ts` | `send_transfer` > 1 AVAX reddeder |
| Admin bypass | `api/agent.ts` | `ADMIN_USERS = ["omer"]` — obscurity ile guvenlik |
| Max agentic loop | `api/agent.ts` | 5 iterasyon sabit sinir |
| Token limiti | `api/agent.ts` | 300 token (admin: 1500) |
| Tool timeout | `api/agent.ts` | `fetchWithTimeout()` — 8s timeout, `AbortController` |
| Tool filtreleme | `api/agent.ts` | `enabledToolNames` ile frontend capability chip'lerinden |
