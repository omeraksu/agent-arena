# Agent Arena — Veritabani Semasi

## Genel Bakis

Veri katmani Supabase PostgreSQL uzerinde calisir. 13 tablo + 1 Storage bucket. Tum tablolarda RLS (Row Level Security) aktiftir. Frontend sadece Supabase Realtime (Presence) kullanir; tablo okuma/yazma islemleri backend Edge Functions uzerinden `SUPABASE_SERVICE_KEY` ile yapilir.

Supabase yapilandirilmamissa tum endpoint'ler in-memory `BoundedMap` fallback ile calisir.

## Tablo Iliskileri

```
┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ activity_events   │     │  arena_names      │     │  rate_limits       │
│ ─────────────────│     │ ─────────────────│     │ ──────────────────│
│ id (PK, uuid)    │     │ address (PK)      │     │ key (PK, text)     │
│ type              │     │ username (UNIQUE)  │     │ count              │
│ address ──────────┤     │ created_at         │     │ updated_at         │
│ data (jsonb)      │     └──────────────────┘     └───────────────────┘
│ created_at        │
└──────────────────┘
         │ (session_reset → getSessionResetTime cache)
         │ (meme_voted → oy tekrari kontrolu)
         │
┌────────┴─────────┐     ┌──────────────────┐     ┌───────────────────┐
│  chat_sessions    │     │  agent_registry   │────▶│ agent_messages     │
│ ─────────────────│     │ ─────────────────│     │ ──────────────────│
│ id (PK, text)     │     │ agent_name (PK)   │     │ id (PK, uuid)      │
│ address           │     │ session_id         │     │ from_agent          │
│ archetype         │     │ archetype          │     │ to_agent            │
│ sliders (jsonb)   │     │ sliders (jsonb)    │     │ message             │
│ messages (jsonb)  │     │ owner_address      │     │ intent              │
│ updated_at        │     │ owner_name         │     │ is_read             │
└──────────────────┘     │ last_seen          │     │ created_at          │
                          └──────────────────┘     └───────────────────┘
                                   │
                                   │ (treasure.generate agent_registry'den okur)
                                   ▼
┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ transfer_requests │     │treasure_fragments │     │     memes           │
│ ─────────────────│     │ ─────────────────│     │ ──────────────────│
│ id (PK, uuid)     │     │ id (PK, uuid)     │     │ id (PK, uuid)      │
│ from_address      │     │ owner_agent        │     │ address             │
│ to_address        │     │ owner_address      │     │ username            │
│ amount            │     │ archetype          │     │ title               │
│ status            │     │ fragment_code      │     │ image_url           │
│ responded_at      │     │ collected_by       │     │ vote_count          │
└──────────────────┘     │ redeemed           │     │ is_winner           │
                          └──────────────────┘     │ nft_token_id        │
                                                    └───────────────────┘
┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   nft_mints       │────▶│  nft_metadata     │     │nft_metadata_drafts │
│ ─────────────────│     │ ─────────────────│     │ ──────────────────│
│ id (PK, uuid)     │     │ token_id (PK)     │     │ address (PK)       │
│ address           │     │ address            │     │ name                │
│ tx_hash           │     │ name               │     │ description         │
│ token_id          │     │ description        │     │ special_trait       │
│ simulated         │     │ image              │     │ image_url           │
└──────────────────┘     │ archetype          │     │ archetype           │
                          │ extra_attributes   │     │ updated_at          │
                          └──────────────────┘     └───────────────────┘
                                   ▲
                          ┌────────┘
                   ┌──────┴─────────────┐
                   │ storage.nft-images  │
                   │ ──────────────────│
                   │ nft-images/<addr>/ │
                   │   <timestamp>.<ext>│
                   └────────────────────┘
```

## Tablo Detaylari

### 1. `activity_events`

Workshop'taki tum aksiyonlarin kronolojik kaydi. Canli feed, XP hesaplama, squad stats ve session scoping icin kullanilir.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | |
| `type` | `text` | NOT NULL | Event tipi (bkz. asagi) |
| `address` | `text` | NOT NULL | Wallet adresi, `"instructor"` veya `"system"` |
| `data` | `jsonb` | DEFAULT `'{}'` | Esnek event payload |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**Index:** `idx_activity_created_at ON (created_at DESC)`

**Event Tipleri:**
`wallet_created`, `faucet`, `transfer`, `nft_mint`, `agent_registered`, `quiz_completed`, `quiz_challenge`, `meme_submitted`, `meme_voted`, `meme_winner`, `signal_pulse`, `instructor_broadcast`, `freeze`, `unfreeze`, `workshop_ended`, `workshop_created`, `workshop_started`, `lobby_joined`, `session_reset`, `treasure_hunt_started`, `fragment_collected`, `treasure_redeemed`

**Ozel Kullanim:**
- `session_reset` event'i: `getSessionResetTime()` cache'inin kaynagi. Tum session-scoped sorgular `.gt("created_at", resetTime)` filtresi kullanir.
- `meme_voted` event'leri: Oy tekrari kontrolu icin sorgulanir (`type=meme_voted AND address=X AND data->>memeId=Y`).
- Lobby cold-start: `workshop_created/started/lobby_joined` event'leri in-memory session'i yeniden olusturur.
- Signal Pulse: `signal_pulse` event'leri batch halinde (her 10 signal'de bir) yazilir.

---

### 2. `chat_sessions`

Agent chat gecmisi. Son 10 mesaj saklanir (her save'de trim edilir).

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `id` | `text` | PK | Session ID string |
| `address` | `text` | | Owner wallet adresi |
| `archetype` | `text` | DEFAULT `'hacker'` | |
| `sliders` | `jsonb` | DEFAULT `'{"technical":50,"tone":30,"detail":40}'` | |
| `messages` | `jsonb` | DEFAULT `'[]'` | Son 10 mesaj |
| `updated_at` | `timestamptz` | DEFAULT `now()` | |

**Kullanan:** `agents.ts` (save/load), `instructor.ts` (recap)

---

### 3. `arena_names`

`.arena` isim sistemi. Her adrese bir benzersiz isim.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `address` | `text` | PK | Lowercase wallet adresi |
| `username` | `text` | UNIQUE, NOT NULL | 3-16 karakter, `[a-z0-9_]` |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**Index:** `idx_arena_names_username ON (username)`

---

### 4. `transfer_requests`

P2P AVAX transfer talepleri.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | |
| `from_address` | `text` | NOT NULL | |
| `from_name` | `text` | | Gonderenin .arena ismi |
| `to_address` | `text` | NOT NULL | |
| `to_name` | `text` | | Alicinin .arena ismi |
| `amount` | `text` | NOT NULL | Token miktari (string) |
| `message` | `text` | | Opsiyonel not |
| `status` | `text` | DEFAULT `'pending'`, CHECK IN (`pending`,`accepted`,`rejected`) | |
| `created_at` | `timestamptz` | DEFAULT `now()` | |
| `responded_at` | `timestamptz` | | Kabul/red zamani |

**Indexes:** `idx_transfer_requests_to ON (to_address, status)`, `idx_transfer_requests_from ON (from_address)`

---

### 5. `rate_limits`

Per-key rate limiting (su an sadece faucet icin).

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `key` | `text` | PK | `"faucet:<address>"` formati |
| `count` | `integer` | NOT NULL, DEFAULT 0 | |
| `created_at` | `timestamptz` | DEFAULT `now()` | |
| `updated_at` | `timestamptz` | DEFAULT `now()` | |

---

### 6. `nft_mints`

Mint islemleri kaydi. Adres basina bir mint.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | |
| `address` | `text` | NOT NULL | Lowercase wallet adresi |
| `tx_hash` | `text` | NOT NULL | On-chain veya sahte hex hash |
| `token_id` | `integer` | | Mint sonrasi atanir |
| `simulated` | `boolean` | DEFAULT `false` | Contract deploy edilmemisse `true` |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**Unique Index:** `idx_nft_mints_address ON (address)` — adres basina tek mint

---

### 7. `nft_metadata`

ERC-721 token metadata'si. `api/metadata/[tokenId].ts` bu tabloyu sorgular.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `token_id` | `integer` | PK | |
| `address` | `text` | NOT NULL | Owner adresi |
| `name` | `text` | NOT NULL | NFT ismi |
| `description` | `text` | | NFT aciklamasi |
| `image` | `text` | | `/nft/<archetype>.svg` veya mutlak URL |
| `workshop_name` | `text` | DEFAULT `'Agent Arena Workshop'` | |
| `workshop_date` | `text` | | ISO tarih (YYYY-MM-DD) |
| `arena_name` | `text` | | Sahibinin .arena ismi |
| `archetype` | `text` | | Agent archetype'i |
| `agent_name` | `text` | | Agent ismi |
| `achievement` | `text` | DEFAULT `'participant'` | `'agent_convinced'` vb. |
| `extra_attributes` | `jsonb` | DEFAULT `'{}'` | Ek trait'ler (special_trait, level, skills_acquired...) |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**Index:** `idx_nft_metadata_address ON (address)`

---

### 8. `nft_metadata_drafts`

Agent chat sirasinda olusturulan taslak NFT metadata'si. Mint oncesi gecici depo.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `address` | `text` | PK | Adres basina tek taslak |
| `name` | `text` | | Taslak NFT ismi |
| `description` | `text` | | Taslak aciklama |
| `special_trait` | `text` | | Ozel ozellik |
| `image_url` | `text` | | Supabase Storage URL veya diger |
| `archetype` | `text` | | |
| `agent_name` | `text` | | |
| `arena_name` | `text` | | |
| `updated_at` | `timestamptz` | DEFAULT `now()` | |

---

### 9. `agent_registry`

Workshop'taki tum kayitli agent'lar.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `agent_name` | `text` | PK | Benzersiz agent ismi |
| `session_id` | `text` | | |
| `archetype` | `text` | DEFAULT `'hacker'` | |
| `sliders` | `jsonb` | DEFAULT `'{}'` | Kisilik slider'lari |
| `owner_address` | `text` | NOT NULL | Sahibinin wallet adresi |
| `owner_name` | `text` | | Sahibinin .arena ismi |
| `last_seen` | `timestamptz` | DEFAULT `now()` | |

---

### 10. `agent_messages`

Agent-arasi mesajlasma.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | |
| `from_agent` | `text` | NOT NULL | Gonderen agent ismi |
| `to_agent` | `text` | NOT NULL | Alici agent ismi |
| `message` | `text` | NOT NULL | Mesaj icerigi |
| `intent` | `text` | DEFAULT `'general'` | Mesaj amaci |
| `is_read` | `boolean` | DEFAULT `false` | |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

**Index:** `idx_agent_messages_to ON (to_agent, created_at DESC)`

---

### 11. `memes`

Meme Arena gonderileri. Schema dosyasinda yok, koddan cikarilmistir.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `address` | `text` | | Gonderenin wallet adresi |
| `username` | `text` | | Gosterim ismi |
| `title` | `text` | | Max 50 karakter |
| `image_url` | `text` | | `data:image/png;base64,...` (inline) |
| `vote_count` | `integer` | DEFAULT 0 | |
| `is_winner` | `boolean` | DEFAULT `false` | |
| `nft_token_id` | `integer` | | Kazanan meme'in NFT token ID'si |
| `created_at` | `timestamptz` | | |

---

### 12. `treasure_fragments`

Hazine avi fragment'leri. Schema dosyasinda yok, koddan cikarilmistir.

| Kolon | Tip | Constraint | Aciklama |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `owner_agent` | `text` | | Fragment'i tutan agent ismi |
| `owner_address` | `text` | | O agent'in sahibinin adresi |
| `archetype` | `text` | | Agent archetype'i |
| `fragment_code` | `text` | | 6 haneli alfanumerik kod |
| `collected_by` | `text` | | Toplayanin adresi (null = toplanmamis) |
| `collected_at` | `timestamptz` | | Toplama zamani |
| `redeemed` | `boolean` | DEFAULT `false` | |

---

### 13. Supabase Storage — `nft-images` Bucket

AI-uretilen NFT gorsellerinin depolandigi bucket.

- **Bucket ismi:** `nft-images`
- **Dosya yolu:** `nft-images/<address_lowercase>/<timestamp>.<ext>`
- **Erisim:** Public read policy

```sql
CREATE POLICY "Public read nft-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'nft-images');
```

**Kullanan:** `api/generate-image.ts` — upload + getPublicUrl → `nft_metadata_drafts.image_url`

---

## RLS Politikalari

Tum tablolarda RLS aktif. Genel pattern:

| Islem | Politika |
|---|---|
| SELECT | `USING (true)` — herkese acik okuma |
| INSERT | `WITH CHECK (true)` — acik yazma |
| UPDATE | `USING (true)` — acik guncelleme |
| DELETE | `USING (true)` — acik silme |

> **Not:** Tablo islemleri frontend'den degil, backend Edge Functions'tan `SUPABASE_SERVICE_KEY` ile yapilir. RLS politikalari genis olmakla birlikte, gercek erisim kontrolu API katmanindadir.

---

## In-Memory Fallback Mekanizmasi

Supabase yapilandirilmamis veya erisilemedigi durumlarda tum endpoint'ler calisir:

| Endpoint | Fallback | Kapasite |
|---|---|---|
| `faucet.ts` | `BoundedMap<string, number>` | 200 entry |
| `names.ts` | Iki `BoundedMap<string, string>` | 500 entry |
| `agent.ts` | `BoundedMap<string, number>` | 500 entry (rate limit) |
| `agents.ts` | `Map` + array | sinir yok (bellekle sinirli) |
| `requests.ts` | array | 100 entry |
| `activity.ts` | array | 100 entry |
| `signal-pulse.ts` | `BoundedMap` | 500 entry |
| `instructor.ts` | `BoundedMap` (recap cache) | 100 entry |

`BoundedMap` (`api/_lib/bounded-map.ts`): `Map` extend eden LRU-benzeri yapi. `maxSize` asildiginda en eski entry evict edilir.

---

## Session Scoping

Workshop oturumlari `session_reset` event'i ile sinirlndir:

1. Egitmen `reset_session` cagirdiginda tum tablolar temizlenir ve `session_reset` event'i yazilir
2. `getSessionResetTime()` (`api/_lib/session-reset-cache.ts`) son reset zamanini 10s cache'ler
3. Tum session-scoped sorgular `.gt("created_at", resetTime)` filtresi ekler
4. `invalidateResetCache()` reset sonrasi cache'i hemen temizler
5. Frontend `useSessionReset()` hook'u 10s aralikla `/api/activity` poll eder; yeni reset algillarsa `localStorage`'i temizleyip sayfayi yeniler
