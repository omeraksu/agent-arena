# ARIA Hub — Durum Raporu

**Tarih:** 7 Mart 2026
**Versiyon:** v0.1 + Sprint 2 Ozellikleri
**Durum:** Workshop'a hazir

---

## Deployment

| | |
|---|---|
| **Production URL** | https://agent-arena-smoky.vercel.app |
| **Platform** | Vercel Hobby Plan (11/12 serverless function kullaniliyor) |
| **Frontend** | React + Vite + Tailwind CSS |
| **Backend** | Vercel Serverless Functions (11 endpoint) |
| **Database** | Supabase (realtime + persistent storage) |
| **AI** | Anthropic Claude API (chat + oracle analizi) |

---

## On-Chain (Avalanche Fuji Testnet)

| | |
|---|---|
| **Network** | Avalanche Fuji (Chain ID: 43113) |
| **RPC** | https://api.avax-test.network/ext/bc/C/rpc |
| **Explorer** | https://testnet.snowtrace.io |
| **Main Wallet** | `0x5741F53E31FAee178Df3C8Bc24739050F48a7Bc8` |
| **Wallet Balance** | ~1.99 AVAX |
| **WorkshopNFT Contract** | `0x879800ace57A725D2fE93253a21c4D03fd902C36` |
| **Contract Durumu** | Deployed, aktif, 0 mint |

### Kapasite

- Faucet: Her ogrenciye 0.005 AVAX, max 3 istek = 0.015 AVAX/ogrenci
- 1.99 AVAX ile ~132 ogrenciye faucet saglanabilir
- 45 ogrenci icin fazlasiyla yeterli

---

## API Endpoints

| Endpoint | Method | Fonksiyon | maxDuration |
|---|---|---|---|
| `/api/agent` | POST | Claude chat + enerji sistemi + recharge | 60s |
| `/api/activity` | GET/POST | Canli feed + `?stats=squad` XP hesabi | default |
| `/api/agents` | GET/POST | Agent kayit, listeleme, mesajlasma | default |
| `/api/chat-history` | GET/POST | Chat session kaydet/yukle | default |
| `/api/faucet` | POST | Test AVAX dagitimi (0.005 AVAX, max 3/adres) | default |
| `/api/generate-image` | POST | NFT gorsel uretimi (Gemini API) | 30s |
| `/api/instructor` | POST | Egitmen paneli + Oracle recap | 60s |
| `/api/mint` | POST | NFT mint (on-chain veya simulated) | default |
| `/api/names` | GET/POST | .arena isim sistemi | default |
| `/api/nfts` | GET | NFT metadata sorgulama | default |
| `/api/requests` | GET/POST | Transfer istek sistemi | default |

**Not:** Vercel Hobby Plan limiti 12 function. Simdi 11 kullaniliyor, 1 slot bos.

---

## Ozellikler

### Temel Moduller (v0.1)

| Modul | Durum | Aciklama |
|---|---|---|
| **Embedded Wallet** | Hazir | thirdweb In-App Wallet, Email/Google login, gasless tx (Account Abstraction) |
| **Agent Chat** | Hazir | Pazarlikci Ajan mekanigi, Claude API, ikna ile NFT kazanma ([MINT_APPROVED] tag) |
| **Token Transfer** | Hazir | Gasless AVAX transferi, adres veya .arena ismiyle gonderim |
| **Canli Feed** | Hazir | Supabase realtime, tum sinif aktivitelerini canli gosterim |
| **NFT Mint** | Hazir | Agent ikna sonrasi on-chain mint, Fuji testnet uzerinde |
| **Faucet** | Hazir | Otomatik test AVAX dagitimi, rate limited (3/adres) |
| **Profil Sayfasi** | Hazir | NFT koleksiyonu, tx gecmisi, workshop rozeti |
| **.arena Isim Sistemi** | Hazir | Kullanici adi kaydi, isimle transfer |
| **Agent Builder** | Hazir | 5 arketip (hacker, sage, pirate, scientist, glitch), slider'lar, isim |
| **Transfer Istekleri** | Hazir | Agent uzerinden baskalarindan AVAX isteme |

### Yeni Ozellikler (Sprint 2)

| Ozellik | Durum | Aciklama |
|---|---|---|
| **Squad Milestones** | Hazir | Sinif toplam XP bari. Hedefler: 500 / 2000 / 5000 / 10000 XP. LiveFeed ustunde gosterilir. |
| **Command Center** | Hazir | Egitmen paneli (`/instructor` route). Broadcast mesaj, freeze/unfreeze, canli istatistikler. Sifre korumalı. |
| **Recharge Mechanic** | Hazir | Enerji sistemi. 30 mesaj limiti, bitince quiz cozerek +5 enerji kazanma. Chat header'da enerji bari. |
| **Oracle's Recap** | Hazir | AI karakter analizi. Profil sayfasindan istenebilir. Claude ogrenci aktivitelerini analiz edip kisisellestirilmis karakter karti olusturur. |

### XP Sistemi

| Aksiyon | XP |
|---|---|
| Cuzdan olusturma | 10 |
| Faucet kullanimi | 20 |
| Transfer | 30 |
| Agent kaydi | 25 |
| Quiz tamamlama | 100 |
| NFT mint | 200 |

### Squad Milestone Hedefleri

| XP | Baslik | Mesaj |
|---|---|---|
| 500 | Ilk Kivilcim | Sinif 500 XP topladi! |
| 2000 | Zincir Uyaniyor | Blockchain zinciri canlaniyor! |
| 5000 | Ag Kuruldu | Sinif olarak bir ag kurdunuz! |
| 10000 | Arena Efsanesi | Workshop rekoru! |

---

## Ortam Degiskenleri

### Frontend (public, tarayicida gorunur)

| Degisken | Aciklama |
|---|---|
| `VITE_THIRDWEB_CLIENT_ID` | thirdweb client ID |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

### Backend (gizli, Vercel env olarak tanimlanmali)

| Degisken | Aciklama |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (chat + oracle) |
| `THIRDWEB_SECRET_KEY` | thirdweb secret key |
| `FUJI_PRIVATE_KEY` | Main wallet private key (faucet + mint) |
| `NFT_CONTRACT_ADDRESS` | WorkshopNFT contract adresi |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `INSTRUCTOR_PASSWORD` | Egitmen paneli sifresi (default: arena2026) |
| `GEMINI_API_KEY` | Gemini API key (gorsel uretimi) |

---

## Dosya Yapisi

```
agent-arena/
├── api/                        # Vercel Serverless Functions (11 adet)
│   ├── activity.ts             # Feed + squad stats
│   ├── agent.ts                # Claude chat + enerji
│   ├── agents.ts               # Agent registry
│   ├── chat-history.ts         # Session persistence
│   ├── faucet.ts               # Test AVAX dagitimi
│   ├── generate-image.ts       # NFT gorsel (Gemini)
│   ├── instructor.ts           # Egitmen + Oracle recap
│   ├── mint.ts                 # NFT mint
│   ├── names.ts                # .arena isim sistemi
│   ├── nfts.ts                 # NFT metadata
│   └── requests.ts             # Transfer istekleri
├── src/
│   ├── components/
│   │   ├── Hub.tsx             # Ana sayfa
│   │   ├── AgentChat.tsx       # Chat + enerji bari + recharge
│   │   ├── WalletModule.tsx    # Cuzdan UI
│   │   ├── TransferForm.tsx    # Token gonderme
│   │   ├── LiveFeed.tsx        # Canli feed + broadcast destegi
│   │   ├── ProfilePage.tsx     # Profil + Oracle analizi
│   │   ├── SquadMilestone.tsx  # Sinif XP bari
│   │   ├── InstructorPanel.tsx # Egitmen dashboard
│   │   └── SessionJoin.tsx     # Katilim ekrani
│   ├── lib/
│   │   ├── thirdweb.ts         # Wallet config (Avalanche Fuji)
│   │   ├── api.ts              # API cagrilari
│   │   ├── supabase.ts         # Supabase client
│   │   └── contracts.ts        # Kontrat ABI
│   └── config/
│       └── constants.ts        # Chain config, XP degerleri, milestone'lar
├── contracts/
│   └── WorkshopNFT.sol         # ERC-721 (deployed on Fuji)
├── docs/                       # Dokumantasyon
├── vercel.json                 # Routing + function config
└── package.json
```

---

## Bilinen Limitler ve Riskler

| Limit | Detay | Etki |
|---|---|---|
| Vercel Hobby 12 function | 11/12 kullaniliyor | 1 yeni endpoint daha eklenebilir, sonra Pro plan veya birlestirme gerekir |
| Rate limit in-memory | Serverless cold start'ta sifirlanir | Supabase aktifse sorun yok, yoksa oturum ici limit kaybolabilir |
| Enerji sistemi in-memory | `sessionBonuses` Map server restart'ta sifirlanir | Workshop suresi icinde sorun olmaz |
| Node.js 23 uyumsuzlugu | Hardhat bazi komutlarda hata veriyor | Deploy `.cjs` wrapper ile cozuldu |

---

## Workshop Hazirlik Kontrol Listesi

- [x] Avalanche Fuji testnet'e gecis tamamlandi
- [x] WorkshopNFT contract deploy edildi
- [x] Main wallet'ta yeterli AVAX var (~2 AVAX)
- [x] Vercel production deploy tamamlandi
- [x] Vercel env variable'lari guncellendi
- [x] 4 yeni ozellik (Squad, Command Center, Recharge, Oracle) entegre edildi
- [ ] End-to-end test (cuzdan olustur → faucet → transfer → chat → NFT mint)
- [ ] Instructor paneli testi (broadcast, freeze, stats)
- [ ] Egitmen sifresi belirlenmeli (`INSTRUCTOR_PASSWORD` env var)
- [ ] Ogrenci sayisi icin stres testi (45 simultane kullanici)
