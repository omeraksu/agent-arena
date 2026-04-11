# ARIA Hub — API Referansi

Tum endpoint'ler Vercel Serverless Functions olarak `api/` dizininde yer alir. Paylasilan altyapi `api/_lib/` altindadir.

## Paylasilan Altyapi (`api/_lib/`)

| Dosya | Gorev |
|---|---|
| `supabase.ts` | Singleton `SupabaseClient` — `SUPABASE_SERVICE_KEY` ile backend yazma yetkisi |
| `viem.ts` | `publicClient` (read-only) + `getWalletClient(privateKey)` — Avalanche Fuji |
| `brand.ts` | Sabitler: `TOKEN_SYMBOL="AVAX"`, `FAUCET_AMOUNT="0.005"`, `EXPLORER_TX_URL`, `RPC_URL` |
| `bounded-map.ts` | `BoundedMap<K,V>` — LRU eviction ile sinirli Map (Supabase fallback) |
| `session-reset-cache.ts` | `getSessionResetTime()` — son `session_reset` event'ini 10s cache'ler |

---

## 1. POST /api/agent

**Dosya:** `api/agent.ts` | **Timeout:** 60s

Claude AI chat proxy. SSE stream, 16 native tool, agentic loop (max 5 iterasyon).

### Request Body

```typescript
{
  messages: { role: "user" | "assistant"; content: string }[];  // zorunlu
  sessionId?: string;             // rate-limit key (yoksa userAddress)
  archetype?: string;             // hacker | sage | pirate | scientist | glitch | architect
  sliders?: {
    technical?: number;           // 0-100
    tone?: number;                // 0-100
    detail?: number;              // 0-100
  };
  agentName?: string;
  userAddress?: string;           // 0x cuzdan adresi
  userName?: string;              // .arena ismi
  pendingAgentMessages?: { from: string; message: string; intent?: string }[];
  personality?: {
    speechStyle?: string;
    curiosity?: string;
    vibe?: string;
    freeText?: string;
  };
  enabledToolNames?: string[];    // capability chip'lerden gelen tool filtresi
}
```

### Response — SSE Stream

Vercel AI SDK `useChat` protokolu:

| Prefix | Anlam | Ornek |
|---|---|---|
| `0:` | Text delta | `0:"Merhaba!"` |
| `2:` | Tool result | `2:[{"toolName":"mint_nft","result":{...},"status":"success"}]` |
| `3:` | Error | `3:"Bir hata olustu"` |
| `d:` | Bitis | `d:{"finishReason":"stop"}` |

### HTTP Hatalari

| Kod | Durum |
|---|---|
| `400` | Eksik `messages` alani |
| `429` | Rate limit asildi (`RATE_LIMIT_PER_SESSION`, varsayilan 60) |
| `500` | Anthropic API hatasi veya yapilandirma eksik |

### Rate Limiting

- In-memory `BoundedMap<string, number>(500)`, key: `sessionId || userAddress || "anonymous"`
- Limit: `RATE_LIMIT_PER_SESSION` env var (varsayilan `60`)
- Admin kullanici `omer`: limit yok, `max_tokens: 1500` (diger kullanicilar 300)

### Agentic Loop

```
1. Claude API cagrisi (stream)
2. Text delta → SSE 0: prefix
3. stop_reason === "tool_use"?
   → Tum tool'lari paralel calistir (Promise.all)
   → Her tool sonucu → SSE 2: prefix
   → Sonuclari conversation'a ekle, 1'e don
4. stop_reason === "end_turn" → SSE d: finish
5. Max 5 dongu
```

### 16 Tool

| Tool | Aciklama | Side Effect |
|---|---|---|
| `mint_nft` | NFT mint (draft metadata'dan) | `POST /api/mint` + activity event |
| `request_transfer` | AVAX transfer talebi | `.arena` name resolve + `POST /api/requests` |
| `discover_agents` | Workshop agent listesi | `GET /api/agents` |
| `message_agent` | Agent'a mesaj gonder | `POST /api/agents` (action: message) |
| `check_messages` | Gelen mesajlari kontrol et | `GET /api/agents?messages=<name>` |
| `get_workshop_stats` | Workshop istatistikleri | `GET /api/activity` |
| `request_faucet` | Test AVAX iste | `POST /api/faucet` |
| `send_transfer` | Kullanicinin cuzdanindan transfer | Name resolve → `transfer_intent` dondutur (frontend execute eder) |
| `check_balance` | Zincir uzerinde bakiye sorgula | `publicClient.getBalance()` |
| `explore_tx` | Snowtrace explorer URL'i olustur | Salt okunur |
| `challenge_quiz` | Blockchain quiz sorusu sor | `quiz_challenge` activity event |
| `draft_nft_metadata` | NFT metadata tasla olustur | Supabase `nft_metadata_drafts` upsert |
| `generate_nft_image` | AI ile NFT gorseli uret | `POST /api/generate-image` (Gemini) |
| `broadcast_arena_news` | Son aktiviteleri ozetle | `GET /api/activity` |
| `get_arena_mood` | Workshop ruh halini olc | `GET /api/agents` + `GET /api/activity` paralel |
| `special_move` | Archetype'a ozel aksiyon | Archetype'a gore degisir (bkz. asagi) |
| `seal_workshop_memory` | Becerileri NFT'ye kaydet | `nft_metadata.extra_attributes` guncelle |

#### `special_move` Detaylari

| Archetype | Aksiyon |
|---|---|
| `hacker` | `scan_contract` — contract bilgisi sorgula |
| `pirate` | Bonus faucet tetikle |
| `sage` | Derin aciklama (bilgilendirici) |
| `scientist` | Gas analizi (bilgilendirici) |
| `glitch` | Sifre cozmece (bilgilendirici) |

#### Tool Filtreleme

`enabledToolNames` array'i gonderilirse, sadece o tool'lar + `special_move` + `get_workshop_stats` Claude'a sunulur. Bu, frontend'deki capability chip seciminden gelir.

---

## 2. GET|POST /api/activity

**Dosya:** `api/activity.ts`

### GET — Event Feed

**Query params:**

| Param | Dondurulen |
|---|---|
| _(yok)_ | Son 20 event (session-scoped) |
| `stats=squad` | Squad XP stats + milestone'lar |
| `progress=true&address=0x...` | Kullanicinin benzersiz event type'lari |

**Squad Stats Response:**
```typescript
{
  totalXP: number;
  counts: Record<string, number>;  // event type → adet
  milestones: { xp: number; title: string; emoji: string }[];
  allMilestones: { xp: number; title: string; emoji: string }[];
}
```

**XP Degerleri:**

| Event Type | XP |
|---|---|
| `wallet_created` | 10 |
| `faucet` | 20 |
| `transfer` | 30 |
| `agent_registered` | 25 |
| `nft_mint` | 200 |
| `quiz_completed` | 100 |
| `meme_submitted` | 50 |
| `meme_voted` | 10 |
| `signal_pulse` | 5 |
| `meme_winner` | 300 |

### POST — Event Kaydi

```typescript
// Request
{ type: string; address: string; data?: Record<string, string> }

// Response: 201
{ id, type, address, data, created_at }
```

**Auth:** Yok. **Rate Limiting:** Yok. **Fallback:** In-memory array (max 100).

---

## 3. GET|POST|DELETE /api/agents

**Dosya:** `api/agents.ts`

### GET

| Query Param | Dondurulen |
|---|---|
| _(yok)_ | `{ agents: AgentRecord[] }` — tum agent'lar (session-scoped, `last_seen DESC`) |
| `messages=<agentName>` | `{ messages: AgentMessage[] }` — son 20 mesaj |
| `chat_session=<id>` | Chat session objesi veya `null` |

### POST

| `action` | Zorunlu Alanlar | Etki |
|---|---|---|
| `"save_chat_session"` | `session_id` | `chat_sessions` upsert (son 10 mesaj saklanir) |
| `"message"` | `from_agent`, `to_agent`, `message` | `agent_messages` insert |
| _(varsayilan: register)_ | `agent_name`, `owner_address` | `agent_registry` upsert; YENI agent ise `agent_registered` event |

### DELETE

Tum `agent_messages` ve `agent_registry` kayitlarini siler. In-memory map'leri temizler.

### Veri Yapilari

```typescript
interface AgentRecord {
  session_id: string;
  agent_name: string;
  archetype: string;
  sliders: object;
  owner_address: string;
  owner_name: string | null;
  last_seen: string;
}

interface AgentMessage {
  id: string;
  from_agent: string;
  to_agent: string;
  message: string;
  intent: string;
  is_read: boolean;
  created_at: string;
}
```

**Auth:** Yok. **Rate Limiting:** Yok.

---

## 4. POST /api/faucet

**Dosya:** `api/faucet.ts`

### Request

```typescript
{ address: string }  // "0x" ile baslamali
```

### Response

```typescript
// Basarili: 200
{ txHash: string }

// Hatalar
// 400: gecersiz adres
// 429: "Faucet hakkini zaten kullandin!"
// 500: yapilandirma eksik veya TX hatasi
```

### Rate Limiting

- Per-address limit: `MAX_REQUESTS_PER_ADDRESS = 1`
- Supabase `rate_limits` tablosu (key: `faucet:<address>`), fallback: `BoundedMap(200)`
- Race condition korunmasi: sayac TX oncesi arttirilir, TX basarisizsa geri alinir

### Side Effect

- On-chain: `0.005 AVAX` gonderir (`FUJI_PRIVATE_KEY` cuzdanindan)

---

## 5. GET|POST /api/mint

**Dosya:** `api/mint.ts`

### GET — NFT Listesi

```typescript
// Query: ?address=0x...
// Response: NftMetadata[]
```

### POST — NFT Mint

```typescript
// Request
{
  address: string;              // zorunlu
  archetype?: string;
  agentName?: string;
  arenaName?: string;
  draftName?: string;
  draftDescription?: string;
  draftSpecialTrait?: string;
  draftImageUrl?: string;
  level?: number;               // 1|2|3 (ikna kalitesi)
}

// Basarili: 200
{ txHash: string; tokenId: number; simulated: boolean }

// Hatalar
// 400: gecersiz adres
// 409: bu adres icin zaten mint yapilmis
// 500: on-chain hata
```

### Dual-Mode

| Mod | Kosul | Davranis |
|---|---|---|
| **Gercek** | `FUJI_PRIVATE_KEY` + `NFT_CONTRACT_ADDRESS` mevcut | On-chain `mintTo()` cagrisi |
| **Simulated** | Biri eksik | Sahte `txHash`, sequential `tokenId`, `simulated: true` |

### Side Effects

- Supabase: `nft_mints` insert, `nft_metadata` upsert
- Activity: `nft_mint` event
- On-chain (gercek mod): `mintTo(address)` ERC-721

---

## 6. GET|POST /api/names

**Dosya:** `api/names.ts`

### GET

| Query Param | Dondurulen |
|---|---|
| `address=0x...` | `{ username: string \| null }` |
| `name=<handle>` | `{ address: string \| null }` (`.arena` suffix'i otomatik temizler) |
| `all=1` | `{ address, username }[]` (max 500) |

### POST — Isim Kaydi

```typescript
// Request
{ address: string; username: string }

// Validasyon: 3-16 karakter, [a-z0-9_], kucuk harfe cevirir
// 409: isim baskasi tarafindan alinmis
// Basarili: { ok: true, username: string, display: "isim.arena" }
```

**Fallback:** Iki `BoundedMap(500)` (address→name, name→address).

---

## 7. GET|POST|PATCH /api/requests

**Dosya:** `api/requests.ts`

### GET

| Query Param | Dondurulen |
|---|---|
| `address=0x...` | Gelen `pending` talepler (son 20) |
| `from=0x...` | Giden tum talepler (son 20) |

### POST — Yeni Talep

```typescript
// Request
{
  fromAddress: string;
  toAddress: string;
  amount: string;
  fromName?: string;
  toName?: string;
  message?: string;
}
// Response: 201 + TransferRequest
```

### PATCH — Talep Yaniti

```typescript
{ id: string; status: "accepted" | "rejected" }
// Response: { ok: true }
```

**Fallback:** In-memory array (max 100).

---

## 8. POST /api/instructor

**Dosya:** `api/instructor.ts` | **Timeout:** 60s

### Auth

`password` alani `INSTRUCTOR_PASSWORD` env var'ina esit olmali (varsayilan `"arena2026"`). `recap` action'i haric.

### Action'lar

| Action | Ek Alanlar | Etki |
|---|---|---|
| `broadcast` | `message: string` | `instructor_broadcast` event ekler |
| `freeze` | — | `isFrozen=true`, `freeze` event |
| `unfreeze` | — | `isFrozen=false`, `unfreeze` event |
| `stats` | — | Tum event'lerden aggregate istatistik + toplam XP |
| `end_workshop` | — | `workshop_ended` event |
| `recap` | `address: string` | Claude ile AI-uretilen karakter profili (max 300 token). Response: `{title, description, traits[], emoji}`. Adres basina cache'lenir. **Auth gerektirmez.** |
| `export_session` | — | 11 tablodan tum verileri JSON olarak dump eder (max 10,000 satir/tablo) |
| `reset_session` | `confirm: "SIFIRLA"` | 11 tablodan tum verileri siler, cache'leri temizler, `session_reset` event yayinlar |
| `finalize_meme` | — | En cok oy alan meme'i bulur → `is_winner=true` → NFT mint eder → `meme_winner` event |

---

## 9. GET|POST /api/lobby

**Dosya:** `api/lobby.ts`

### GET

```typescript
// Query: ?code=ABC123
// Response
{
  status: "waiting" | "countdown" | "started" | "not_found";
  participantCount: number;
  participants: { address: string; username: string | null }[];
  countdownRemainingMs?: number;
}
```

### POST Action'lari

| Action | Auth | Ek Alanlar | Etki |
|---|---|---|---|
| `create_workshop` | `password` | — | 6 haneli kod olusturur, `workshop_created` event |
| `join` | Yok | `code`, `address`, `username?` | Katilimci ekler (idempotent), `lobby_joined` event |
| `start_workshop` | `password` | — | `countdown` → 4s sonra `started`, `workshop_started` event |
| `reset_lobby` | `password` | — | In-memory session'i sifirlar |

**Cold-start recovery:** `activity_events`'ten `workshop_created/started/lobby_joined` event'lerini okuyarak in-memory durumu yeniden olusturur.

---

## 10. GET|POST /api/memes

**Dosya:** `api/memes.ts`

**Supabase zorunlu** — yoksa 500 dondurur.

### GET

```typescript
// Query: ?address=0x... (opsiyonel)
{
  memes: MemeRow[];       // vote_count DESC, session-scoped
  hasSubmitted: boolean;  // address varsa
}
```

### POST — Meme Gonder

```typescript
{
  address: string;
  title: string;          // max 50 karakter
  imageBase64: string;    // data URI olarak saklanir
  username?: string;
  mimeType?: string;      // varsayilan "image/png"
}
// 201: { ok: true, memeId: string }
// 409: session'da zaten gonderilmis
```

### POST — Oyla

```typescript
{
  action: "vote";
  memeId: string;
  voterAddress: string;
  memeTitle?: string;
}
// 200: { ok: true, newVoteCount: number }
// 400: kendi meme'ine oy veremez veya zaten oy vermis
```

Oy tekrari kontrolu `activity_events` tablosu uzerinden yapilir.

---

## 11. GET|POST /api/signal-pulse

**Dosya:** `api/signal-pulse.ts`

### GET

```typescript
{
  totalSignals: number;
  participantCount: number;
  milestones: { threshold: number; title: string; emoji: string }[];
  nextMilestone: { ... } | null;
  allMilestones: [100, 300, 500];
  goalReached: boolean;      // totalSignals >= 500
  round: RoundResponse | null;
}
```

### POST — Round Baslat (Egitmen)

```typescript
{ action: "start_round"; password: string }
// Round: countdown (5s) → active (30s) → ended
// Response: { ok: true, round: RoundResponse }
```

### POST — Signal Gonder (Ogrenci)

```typescript
{ address: string; username?: string }
// Rate limit: 1 signal / 1000ms per address (in-memory)
// 200: { ok: true, totalSignals, roundSignals, roundParticipants }
```

**Round sonu:** `syncScore` (0-100) hesaplanir — ayni 1 saniyelik pencereye tiklayan katilimci orani.

**Supabase batch yazma:** Her 10 signal'de bir `signal_pulse` event yazilir.

---

## 12. GET|POST /api/treasure

**Dosya:** `api/treasure.ts`

### GET

```typescript
// Query: ?address=0x...
{
  collected: Fragment[];
  count: number;
  needed: 3;
  canRedeem: boolean;
  hasRedeemed: boolean;
}
```

### POST Action'lari

| Action | Auth | Aciklama |
|---|---|---|
| `generate` | `password` | Her agent icin 1 fragment olusturur (6 haneli kod) |
| `collect` | Yok | Baska bir agent'in fragment'ini topla (kendi fragment'ini toplayamaz) |
| `redeem` | Yok | 3 fragment ile odul al → `treasure_redeemed` event, `"Master Scout"` badge |

---

## 13. POST /api/generate-image

**Dosya:** `api/generate-image.ts` | **Timeout:** 30s

### Request

```typescript
{
  mode: "generate" | "upload";
  address: string;
  // generate modu:
  prompt?: string;          // Ingilizce, Gemini'ye gonderilir
  // upload modu:
  imageData?: string;       // base64 (data URI prefix ile veya olmadan)
  mimeType?: string;        // varsayilan "image/png"
}
```

### Response

```typescript
// Basarili
{ success: true; imageUrl: string; filePath: string }

// Hatalar
// 400: eksik alan, yanlis mod, veya gorsel > 2 MB
// 500: Gemini hatasi, storage hatasi, veya Supabase yapilandirilmamis
```

### Side Effects

- `generate` modu: Gemini `gemini-2.0-flash-exp` API cagrisi
- Supabase Storage'a yukleme: `nft-images/<address>/<timestamp>.<ext>`
- `nft_metadata_drafts.image_url` guncellenir

---

## 14. GET /api/metadata/[tokenId]

**Dosya:** `api/metadata/[tokenId].ts`

ERC-721 standart metadata endpoint'i. NFT marketplace'ler ve explorer'lar bu URL'yi sorgular.

### Response

```typescript
{
  name: string;
  description: string;
  image: string;            // mutlak URL
  attributes: [
    { trait_type: "Workshop", value: "ARIA Hub Workshop" },
    { trait_type: "Date", value: "2026-03-11" },
    { trait_type: "Achievement", value: "agent_convinced" },
    // Opsiyonel: Archetype, Agent Name, Arena Name
    // + extra_attributes'ten gelen ek trait'ler
  ]
}
```

**Cache:** `Cache-Control: public, max-age=60, s-maxage=300`

**Fallback:** Token bulunamazsa genel bir stub metadata dondurur.

---

## 15. POST /api/fix-nft-archetypes

**Dosya:** `api/fix-nft-archetypes.ts`

Tek seferlik migration endpoint'i. `nft_metadata` tablosunda `archetype IS NULL` olan satirlari bulur, NFT `name` alanini hardcoded Turkce-archetype haritasina gore eslestirir ve `archetype` + `image` alanlarini gunceller.

```typescript
// Response
{
  message: "Updated N NFTs";
  updated: number;
  details: { token_id: number; name: string; archetype: string }[];
  skipped: { token_id: number; name: string; reason: string }[];
}
```

---

## Ozet Tablosu

| Endpoint | Methodlar | Auth | On-chain TX | Supabase Tablolari |
|---|---|---|---|---|
| `/api/agent` | POST | Rate limit | Tool uzerinden | `nft_metadata_drafts`, `nft_metadata` |
| `/api/activity` | GET, POST | — | — | `activity_events` |
| `/api/agents` | GET, POST, DELETE | — | — | `agent_registry`, `agent_messages`, `chat_sessions` |
| `/api/faucet` | POST | Per-address limit | AVAX gonder | `rate_limits` |
| `/api/mint` | GET, POST | Dedup check | `mintTo()` ERC-721 | `nft_mints`, `nft_metadata` |
| `/api/names` | GET, POST | — | — | `arena_names` |
| `/api/requests` | GET, POST, PATCH | — | — | `transfer_requests` |
| `/api/instructor` | POST | `INSTRUCTOR_PASSWORD` | — | `activity_events` + 11 tablo (reset) |
| `/api/lobby` | GET, POST | Password (admin) | — | `activity_events` |
| `/api/memes` | GET, POST | — | — | `memes`, `activity_events` |
| `/api/signal-pulse` | GET, POST | Password (round) | — | `activity_events` (batch) |
| `/api/treasure` | GET, POST | Password (generate) | — | `treasure_fragments`, `activity_events` |
| `/api/generate-image` | POST | — | — | `nft_metadata_drafts`, Storage |
| `/api/metadata/[id]` | GET | — | — | `nft_metadata` (read) |
| `/api/fix-nft-archetypes` | POST | — | — | `nft_metadata` (update) |
