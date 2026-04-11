# ARIA Hub — Sistem Mimarisi

## Genel Bakis

ARIA Hub, blockchain workshop'larinda katilimcilara uygulamali deneyim sunan bir egitim platformudur. Tek bir Vite + React SPA, Vercel Serverless Functions backend, Supabase realtime veri katmani ve Avalanche Fuji Testnet uzerinde calisir.

```
                          ┌─────────────────────────────────────────┐
                          │           KULLANICI (Tarayici)           │
                          └──────────────┬──────────────────────────┘
                                         │
                          ┌──────────────▼──────────────────────────┐
                          │         React SPA (Vite)                │
                          │  thirdweb In-App Wallet + Smart Account │
                          │  Supabase Realtime (Presence)           │
                          └──┬────────┬────────┬────────┬──────────┘
                             │        │        │        │
                    ┌────────▼──┐ ┌───▼────┐ ┌─▼──────┐ │
                    │ /api/agent│ │/api/mint│ │/api/   │ │
                    │ (Claude   │ │/faucet  │ │activity│ │ ... 14 endpoint
                    │  SSE +    │ │/names   │ │/agents │ │
                    │  16 tool) │ │/requests│ │/lobby  │ │
                    └─────┬─────┘ └───┬────┘ └──┬─────┘ │
                          │           │         │        │
              ┌───────────▼───┐  ┌────▼─────┐  ┌▼───────▼─────────┐
              │ Anthropic     │  │ Avalanche │  │    Supabase       │
              │ Claude API    │  │ Fuji      │  │ - PostgreSQL      │
              │ (Sonnet 4)    │  │ Testnet   │  │ - Realtime        │
              └───────────────┘  │ (viem)    │  │ - Storage         │
              ┌───────────────┐  └───────────┘  └───────────────────┘
              │ Google Gemini │
              │ (gorsel       │
              │  uretimi)     │
              └───────────────┘
```

## Tasarim Ilkeleri

| Ilke | Aciklama |
|---|---|
| **Zero-barrier** | Cuzdan kurulumu, seed phrase, extension yok. Email/Google login ile otomatik smart wallet. Gas ucreti gorunmez (sponsorGas). |
| **Workshop-first** | Her ozellik "bu workshop'ta calisir mi?" testinden gecmeli. |
| **Minimal mimari** | Monorepo ve ayri backend servisi yok. Tek Vite projesi + Vercel Serverless Functions. |
| **Gasless UX** | Account Abstraction (Paymaster) ile ogrenci hicbir zaman gas odemez. |
| **Sosyal deneyim** | Canli feed, birbirinin islemlerini gorme, rekabet — blockchain seffafligi deneyimle ogrenilir. |
| **Simulated fallback** | Contract deploy edilmemis olsa bile workshop calisir (simulated mint modu). |

## Bilesen Haritasi

### Frontend (React SPA)

| Bilesen | Dosya | Gorev |
|---|---|---|
| Hub | `src/components/Hub.tsx` | Ana sayfa, modul kart grid'i, ilerleme cubugu |
| WalletModule | `src/components/WalletModule.tsx` | 5 adimli cuzdan onboarding (brief → auth → name → fuel → tx) |
| AgentChat | `src/components/AgentChat.tsx` | AI chat UI, 5 adimli agent builder, tool progress |
| AgentDiscovery | `src/components/AgentDiscovery.tsx` | Workshop agent'larini listele, mesajlasma, hazine avi |
| LiveFeed | `src/components/LiveFeed.tsx` | HTTP polling ile canli aktivite feed'i |
| ProfilePage | `src/components/ProfilePage.tsx` | NFT'ler, badge'ler, islem gecmisi |
| MemeArena | `src/components/MemeArena.tsx` | Meme yukleme + oylama |
| SignalPulse | `src/components/SignalPulse.tsx` | Senkronize tiklama mini-oyunu |
| InstructorPanel | `src/components/InstructorPanel.tsx` | Egitmen kontrolleri |
| Lobby | `src/components/Lobby.tsx` | Workshop katilim ekrani |
| AgentBuilder | `src/components/builder/AgentBuilder.tsx` | ReactFlow tabanli gorsel agent builder |

### Backend (15 Vercel Serverless Function)

| Endpoint | Dosya | Gorev |
|---|---|---|
| `POST /api/agent` | `api/agent.ts` | Claude API proxy, SSE stream, 16 tool, agentic loop (max 5) |
| `GET/POST /api/activity` | `api/activity.ts` | Event feed, XP hesaplama, squad stats |
| `GET/POST/DELETE /api/agents` | `api/agents.ts` | Agent registry, mesajlasma, chat session |
| `POST /api/faucet` | `api/faucet.ts` | Test AVAX dagitimi (0.005 AVAX) |
| `GET/POST /api/mint` | `api/mint.ts` | NFT mint (on-chain veya simulated) |
| `GET/POST /api/names` | `api/names.ts` | .arena isim sistemi |
| `GET/POST/PATCH /api/requests` | `api/requests.ts` | P2P transfer request |
| `POST /api/instructor` | `api/instructor.ts` | 9 instructor action (broadcast, freeze, reset, recap...) |
| `GET/POST /api/lobby` | `api/lobby.ts` | Workshop lobby (create, join, start) |
| `GET/POST /api/memes` | `api/memes.ts` | Meme Arena |
| `GET/POST /api/signal-pulse` | `api/signal-pulse.ts` | Signal Pulse oyunu |
| `GET/POST /api/treasure` | `api/treasure.ts` | Hazine avi |
| `POST /api/generate-image` | `api/generate-image.ts` | Gemini gorsel uretimi + Supabase Storage |
| `GET /api/metadata/[tokenId]` | `api/metadata/[tokenId].ts` | ERC-721 metadata JSON |
| `POST /api/fix-nft-archetypes` | `api/fix-nft-archetypes.ts` | Tek seferlik archetype migration |

### Blockchain

| Bilesen | Detay |
|---|---|
| Ag | Avalanche Fuji Testnet (chainId 43113) |
| Contract | `WorkshopNFT.sol` — ERC-721 (OpenZeppelin v5.6.1), `mintTo` + `totalSupply` + `setBaseURI` |
| Frontend wallet | thirdweb In-App Wallet + Account Abstraction (Smart Wallet, sponsorGas) |
| Backend wallet | viem `WalletClient` (`FUJI_PRIVATE_KEY`) — faucet + mint islemleri |
| Explorer | Snowtrace (`testnet.snowtrace.io`) |

### Realtime & Veri

| Bilesen | Detay |
|---|---|
| Veritabani | Supabase PostgreSQL (13 tablo) |
| Realtime | Supabase Presence (`agent-presence` channel) — agent online durumu |
| Live Feed | HTTP polling (`/api/activity`, 5s aralik) |
| Storage | Supabase Storage (`nft-images` bucket) — AI-uretilen NFT gorselleri |
| In-memory fallback | `BoundedMap` (LRU) — Supabase yokken tum endpoint'ler calisir |

### AI

| Bilesen | Detay |
|---|---|
| Agent Chat | Anthropic Claude Sonnet 4 (`claude-sonnet-4-20250514`) — native tool calling |
| Gorsel Uretim | Google Gemini (`gemini-2.0-flash-exp`) — NFT gorsel uretimi |
| Recap | Claude Sonnet 4 — workshop ozet profili (instructor action) |

## Veri Akisi

```
Kullanici aksiyonu (ornek: "NFT istiyorum")
  │
  ▼
AgentChat.tsx → useChat() → POST /api/agent (SSE stream)
  │
  ▼
api/agent.ts → Claude API (tool_use: draft_nft_metadata)
  │                          ↓
  │               Supabase nft_metadata_drafts (upsert)
  │
  ▼
Claude API (tool_use: generate_nft_image)
  │                          ↓
  │               POST /api/generate-image → Gemini API → Supabase Storage
  │
  ▼
Claude API (tool_use: mint_nft)
  │                          ↓
  │               POST /api/mint → viem mintTo() on-chain
  │                          ↓
  │               Supabase nft_mints + nft_metadata (insert)
  │                          ↓
  │               POST /api/activity (nft_mint event)
  │
  ▼
SSE 2: tool results → AgentChat.tsx (tool progress UI)
SSE 0: "Tebrikler!" → chat message
SSE d: finish
  │
  ▼
LiveFeed.tsx → GET /api/activity → "X agent'i ikna edip NFT kazandi!"
```

## Tech Stack

| Katman | Paket | Versiyon |
|---|---|---|
| UI Framework | `react` / `react-dom` | ^18.3.1 |
| Build | `vite` | ^6.2.0 |
| Routing | `react-router-dom` | ^7.3.0 |
| Styling | `tailwindcss` (v4, Vite plugin) | ^4.1.0 |
| Blockchain (frontend) | `thirdweb` | ^5.92.0 |
| Blockchain (backend) | `viem` | ^2.47.0 |
| AI (chat) | `@anthropic-ai/sdk` | ^0.78.0 |
| AI (streaming) | `ai` (Vercel AI SDK) | ^4.3.0 |
| AI (gorsel) | Google Gemini API | `gemini-2.0-flash-exp` |
| Realtime | `@supabase/supabase-js` | ^2.49.0 |
| Agent Builder | `@xyflow/react` | ^12.10.1 |
| Graph Layout | `dagre` | ^0.8.5 |
| Markdown | `react-markdown` + `remark-gfm` | ^10.1.0 / ^4.0.1 |
| Schema | `zod` | ^4.3.6 |
| Smart Contract | `@openzeppelin/contracts` | ^5.6.1 |
| Contract Tooling | `hardhat` | ^2.28.6 |
| TypeScript | `typescript` | ~5.7.2 |
| Deploy | Vercel | — |

## Dizin Yapisi

```
agent-arena/
├── CLAUDE.md                         # Proje dokumantasyonu
├── package.json                      # Bagimliklar ve script'ler
├── vite.config.ts                    # Vite + Tailwind + @ alias
├── tsconfig.json                     # TypeScript (src/ only)
├── hardhat.config.cts                # Hardhat (Fuji + Sepolia)
├── vercel.json                       # Routing + function timeout'lari
├── supabase-schema.sql               # Veritabani sema tanimlamalari
│
├── api/                              # Vercel Serverless Functions
│   ├── _lib/                         # Paylasilan altyapi
│   │   ├── supabase.ts               #   Singleton Supabase client
│   │   ├── viem.ts                   #   publicClient + getWalletClient
│   │   ├── brand.ts                  #   Network/token sabitleri
│   │   ├── bounded-map.ts            #   LRU in-memory fallback Map
│   │   └── session-reset-cache.ts    #   Session reset zamani cache
│   ├── agent.ts                      # Claude AI proxy (SSE, 16 tool)
│   ├── activity.ts                   # Event feed + XP
│   ├── agents.ts                     # Agent registry + mesajlasma
│   ├── faucet.ts                     # Test AVAX dagitimi
│   ├── mint.ts                       # NFT mint
│   ├── names.ts                      # .arena isim sistemi
│   ├── requests.ts                   # P2P transfer request
│   ├── instructor.ts                 # Egitmen kontrolleri
│   ├── lobby.ts                      # Workshop lobby
│   ├── memes.ts                      # Meme Arena
│   ├── signal-pulse.ts               # Signal Pulse oyunu
│   ├── treasure.ts                   # Hazine avi
│   ├── generate-image.ts             # Gemini gorsel uretimi
│   ├── fix-nft-archetypes.ts         # Migration script
│   └── metadata/
│       └── [tokenId].ts              # ERC-721 metadata endpoint
│
├── src/
│   ├── main.tsx                      # Entry point (ThirdwebProvider)
│   ├── App.tsx                       # Router + layout + session reset
│   ├── index.css                     # Tailwind + custom CSS vars
│   ├── components/
│   │   ├── Hub.tsx                   # Ana sayfa
│   │   ├── WalletModule.tsx          # Cuzdan onboarding
│   │   ├── AgentChat.tsx             # AI chat + agent builder
│   │   ├── AgentDiscovery.tsx        # Agent listesi + mesajlasma
│   │   ├── TransferForm.tsx          # Token gonderme
│   │   ├── TransferRequests.tsx      # Transfer request UI
│   │   ├── LiveFeed.tsx              # Canli aktivite feed'i
│   │   ├── ProfilePage.tsx           # Profil (NFT + badge + tx)
│   │   ├── BadgeCard.tsx             # Tek badge
│   │   ├── BadgeGrid.tsx             # Badge grid
│   │   ├── ChallengeModule.tsx       # Quiz skill runner
│   │   ├── SquadMilestone.tsx        # Sinif XP banner'i
│   │   ├── MemeArena.tsx             # Meme yukleme + oylama
│   │   ├── SignalPulse.tsx           # Senkronize tiklama
│   │   ├── InstructorPanel.tsx       # Egitmen paneli
│   │   ├── Lobby.tsx                 # Workshop katilim
│   │   ├── MarkdownMessage.tsx       # Markdown renderer
│   │   └── builder/                  # Gorsel agent builder
│   │       ├── AgentBuilder.tsx
│   │       ├── BuilderCanvas.tsx
│   │       ├── BuilderPalette.tsx
│   │       ├── BuilderTopBar.tsx
│   │       ├── CompileAnimation.tsx
│   │       ├── edges/NeonEdge.tsx
│   │       ├── hooks/useAutoLayout.ts
│   │       ├── hooks/useBuilderState.ts
│   │       ├── nodes/ArchetypeNode.tsx
│   │       ├── nodes/CapabilityNode.tsx
│   │       ├── nodes/IdentityNode.tsx
│   │       └── utils/compileConfig.ts
│   ├── contexts/
│   │   └── ArenaContext.tsx           # Global state (userName, progress)
│   ├── lib/
│   │   ├── thirdweb.ts               # thirdweb client + smart wallet config
│   │   ├── contracts.ts              # Contract helper
│   │   ├── supabase.ts               # Supabase client + Presence
│   │   ├── api.ts                    # Tum frontend API cagrilari
│   │   ├── strands.ts                # Strands SDK agent factory (legacy)
│   │   └── strands-tools.ts          # Strands tools (legacy)
│   └── config/
│       ├── brand.ts                  # Ag/token/explorer sabitleri
│       ├── constants.ts              # XP degerleri, polling araliklari
│       ├── archetypes.ts             # 6 archetype tanimi
│       ├── badges.ts                 # 11 badge tanimi
│       └── challenges.ts             # 6 quiz skill track
│
├── contracts/
│   └── WorkshopNFT.sol               # ERC-721 (OpenZeppelin v5)
│
├── scripts/
│   ├── deploy.cts                    # Hardhat deploy script
│   └── set-base-uri.cts              # BaseURI guncelleme
│
├── public/
│   ├── nft/                          # 7 archetype SVG (hacker, sage, pirate...)
│   └── brand/                        # Avalanche logo + brand assets
│
└── docs/
    ├── technical/                    # (bu dokumantasyon)
    └── *.md                          # Workshop raporlari
```

## Ortam Degiskenleri

### Frontend (Vite, tarayicida gorunur)

| Degisken | Aciklama |
|---|---|
| `VITE_THIRDWEB_CLIENT_ID` | thirdweb public client ID |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (read-only) |

### Backend (Vercel, gizli)

| Degisken | Aciklama | Varsayilan |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API key | — |
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `FUJI_PRIVATE_KEY` | Faucet/mint cuzdan private key | — |
| `NFT_CONTRACT_ADDRESS` | Deploy edilmis WorkshopNFT adresi | — |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | — |
| `INSTRUCTOR_PASSWORD` | Egitmen paneli sifresi | `"arena2026"` |
| `RATE_LIMIT_PER_SESSION` | Session basina max Claude cagri | `60` |
| `NFT_BASE_URI` | Contract baseURI (deploy icin) | — |
| `ETHERSCAN_API_KEY` | Contract verification | — |

### Fallback

- `FUJI_PRIVATE_KEY` yoksa `SEPOLIA_PRIVATE_KEY` denenir
- `SUPABASE_SERVICE_KEY` yoksa `VITE_SUPABASE_ANON_KEY` denenir
- Supabase tamamen yoksa in-memory `BoundedMap` fallback aktif olur

## Deploy

```bash
# Tek komut ile deploy
vercel deploy

# veya production
vercel --prod
```

Vercel otomatik olarak:
1. `vite build` ile frontend'i derler
2. `api/` altindaki her `.ts` dosyasini serverless function olarak deploy eder
3. `vercel.json`'daki routing ve timeout ayarlarini uygular

Contract deploy (ayri adim):
```bash
npm run deploy:fuji
# Cikan adresi NFT_CONTRACT_ADDRESS env var olarak Vercel'e ekle
npm run set-base-uri:fuji
```
