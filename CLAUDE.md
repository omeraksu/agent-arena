# CLAUDE.md — ARIA Hub

> **Rebrand notu:** Proje daha önce "Agent Arena" olarak anılıyordu. v0.3 sprint'iyle birlikte ürün adı **ARIA Hub** oldu ("Avalanche Research & Interface Architect"). Repo path'i (`agent-arena/`), git history ve bazı dış rapor dosyalarında eski ad korunur; UI, yeni dokümanlar ve kod-içi string'lerin tamamı "ARIA Hub" kullanır.

## Proje Nedir?

ARIA Hub, Avalanche blockchain üzerinde gamified bir eğitim platformudur. Katılımcılar bir AI agent ("ARIA") ile etkileşime girer, embedded cüzdan üzerinden on-chain aktiviteler gerçekleştirir ve blockchain geliştirme sürecinin gereksinimlerini bizzat yaşayarak öğrenir.

Team1 Türkiye + Koza DAO + Kozalak Hub çatısı altında geliştirilmektedir.

## Mevcut Durum: Sprint v0.1 — "Mersin Workshop"

- **Hedef kitle:** Güney Gelişim Koleji öğrencileri (5. sınıftan 11. sınıfa kadar — yaş aralığı 11-17)
- **Ortam:** Lab bilgisayarları, web browser üzerinden
- **Süre:** 2-3 saatlik workshop oturumu
- **Katılımcı:** ~45 kişi (ön quiz verisi mevcut)
- **Ağ:** Avalanche Fuji Testnet

## Katılımcı Analizi (Gelişim Challenge Quiz Verisi)

45 öğrenci ön quiz'i tamamladı. Bu veri workshop stratejisini doğrudan şekillendiriyor.

### Demografik Dağılım
- 9. sınıf: 14 kişi (en kalabalık grup)
- 10. sınıf: 9 kişi
- 11. sınıf: 8 kişi
- 7. sınıf: 3 kişi
- 5-6. sınıf: 2 kişi
- **Önemli:** Yaş aralığı beklenenden geniş. UI 5. sınıf çocuğunun da rahatça kullanabileceği kadar sezgisel olmalı.

### Bilgi Seviyesi
- **Ortalama puan: 80/100** — beklenenden yüksek
- 16 kişi "Dijital Kaşif" (en yüksek rozet), 25 kişi "Teknoloji Yolcusu" (orta), sadece 2 "Meraklı Başlangıç"
- **Sonuç:** "Blockchain nedir?" giriş kısmını kısa tut, doğrudan uygulamaya geç.

### Güçlü Yönler
- AI agent temel tanımı: %81 doğru
- AI çalışma döngüsü (algıla-karar ver-harekete geç): %95 doğru
- Blockchain'in temel özelliği (değiştirilemezlik): %84 doğru
- Blockchain'in pratik kullanımı (tedarik zinciri): %93 doğru

### Zayıf Yönler ve Workshop Fırsatları
- **AI-teknoloji eşleştirme (%65):** Teoriyi biliyorlar ama "hangi teknoloji hangi işe yarar" pratiğinde karışıklık var → Agent Chat modülü bu boşluğu dolduracak
- **"Blockchain = veri saklama" yanılgısı:** Açık uçlu cevaplarda neredeyse herkes blockchain'i sadece "kayıt tutar, bilgi saklar" olarak tanımladı. Transfer, sahiplik, şeffaflık kavramları eksik → Workshop'ta token transfer ve NFT sahipliği deneyimleri bu yanılgıyı kıracak
- **Dikkat süresi:** Ortalama quiz süresi 6 dakika, en hızlı 1:35 → Her workshop aktivitesi MAX 15 dakika olmalı

### Öne Çıkan Öğrenciler (potansiyel co-facilitator)
- **Muhammed Utku M.** (11A, 94 puan): Boss soruda AI+blockchain entegrasyonunu profesyonel düzeyde açıkladı
- **Tarık Uşan** (6A, Dijital Kaşif): Yaşına göre çok ileri düzeyde yapılandırılmış cevaplar
- **Kıvanç Kurt** (10A, 94 puan, 4 dk): Hem hızlı hem doğru, algoritmik düşünce yapısı güçlü
- **Ali Deniz Tekniker** (11A, 94 puan): Pratik uygulama senaryoları üretti

## Temel Tasarım İlkeleri

1. **Zero-barrier:** Cüzdan kurulumu, seed phrase, extension yok. Tarayıcı aç, başla. Gas ücreti bile görünmez (gasless tx).
2. **Biz her şeyi yapmıyoruz:** Kritik yapıştırıcı katmanı biz yazıyoruz, eğitim içeriği ve challenge'lar için mevcut açık kaynak araçları (ethskills vb.) ve servisleri kullanıyoruz.
3. **Workshop-first:** Her özellik "bu workshopta işe yarar mı?" testinden geçmeli. Geçmiyorsa sonraki faza.
4. **Incremental delivery:** Her workshop bir öncekinden daha zengin olacak. v0.1 minimal ama çalışır, v0.2'de agent builder eklenir, v0.3'te on-chain agent identity gelir.
5. **Veri-odaklı UX:** Quiz verisi gösteriyor ki yaş aralığı 11-17, seviye ortalamanın üstünde. UI hem 5. sınıfın kullanabileceği kadar basit hem 11. sınıfın sıkılmayacağı kadar "cool" olmalı. Her aktivite max 15 dakika.
6. **"Kayıt tutma" değil "sahiplik":** Öğrenciler blockchain'i zaten kayıt/depolama olarak biliyor. Platform transfer, sahiplik ve şeffaflık kavramlarını DENEYEREK öğretmeli.
7. **Minimal mimari:** Monorepo ve ayrı backend servisi bu ölçek için overkill. Tek Vite projesi + Vercel/Supabase Edge Functions yeterli. Karmaşıklık = risk.
8. **Sosyal deneyim:** Workshop bireysel değil, sınıfça yaşanıyor. Canlı feed, birbirinin işlemlerini görme, rekabet hissi — bunlar deneyimi güçlendirir.

## Mimari: v0.1 (Minimal Workshop)

```
┌──────────────────────────────────────────────────────────┐
│                     AGENT ARENA                           │
│              (Tek Vite + React SPA)                       │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │  Cüzdan  │ │  Agent   │ │ Challenge│ │  Canlı      │ │
│  │  Modülü  │ │  Chat    │ │  / Quiz  │ │  Sınıf Feed │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬──────┘ │
│       │             │            │               │        │
└───────┼─────────────┼────────────┼───────────────┼────────┘
        │             │            │               │
   ┌────▼──────────┐  │      ┌────▼──────┐  ┌─────▼──────┐
   │  thirdweb     │  │      │ ethskills │  │ Supabase   │
   │  In-App       │  │      │ / kendi   │  │ Realtime   │
   │  Wallet +     │  │      │ quiz app  │  │ (canlı tx) │
   │  Account      │  │      └───────────┘  └────────────┘
   │  Abstraction  │  │
   │  (Gasless TX) │  │
   └────┬──────────┘  │
        │        ┌────▼────────────┐
        │        │ Vercel Edge     │
        │        │ Functions       │
        │        │ - Claude API    │
        │        │   proxy         │
        │        │ - Rate limiting │
        │        │ - Faucet API    │
        │        └────────────────┘
   ┌────▼────────────────┐
   │  Avalanche Fuji     │
   │  Testnet            │
   │  - Gasless transfer │
   │  - NFT mint         │
   │  - Workshop NFT     │
   └─────────────────────┘
```

### Modüller

#### 1. Cüzdan Modülü (KRİTİK — biz yazıyoruz)
- **Neden biz:** Lab bilgisayarlarına MetaMask kurulamaz. Embedded wallet zorunlu.
- **Araç:** thirdweb In-App Wallet + Account Abstraction (Smart Wallet)
- **Neden thirdweb:**
  - Ücretsiz tier 45 öğrenci için yeterli
  - Email/Google login → otomatik cüzdan, tek adım
  - Account Abstraction (Paymaster) ile gasless transaction — öğrenci gas ücreti görmez
  - Fuji testnet desteği mevcut
- **Akış:**
  1. Öğrenci hub'a gelir → "Başla" butonuna tıklar
  2. Email veya Google login ile embedded cüzdan otomatik oluşur (smart wallet)
  3. Öğrenci cüzdan adresini görür, bakiyesini takip eder
  4. Test AVAX otomatik gelir (backend faucet veya eğitmen QR ile)
  5. Gasless transfer: arkadaşına token gönder (gas ücreti yok!)
  6. NFT mint: agent'ı ikna ederek kazan
- **UI:** Cüzdan adresi (kısaltılmış), bakiye, son işlemler listesi, gönder butonu, achievement badge'leri

#### 2. Agent Chat — "Pazarlıkçı Ajan" (KRİTİK — biz yazıyoruz)
- **Neden biz:** "Agent ile tanışma" deneyiminin çekirdeği. Sıradan bir chatbot değil, "ikna mekaniği" olan bir ajan.
- **Araç:** Anthropic Claude API (Vercel Edge Function proxy üzerinden)
- **Konsept: Pazarlıkçı Ajan**
  - Agent sadece sohbet etmez, bir "kapı bekçisi" rolündedir
  - NFT mint etmek için öğrenci agent'ı İKNA etmeli (blockchain bilgisiyle veya yaratıcı argümanla)
  - Agent öğrencinin bilgi seviyesini test eder, doğru cevaplarla "ikna olur"
  - İkna olunca backend üzerinden on-chain işlem tetiklenir (NFT mint)
  - Bu mekanik "buton tıkla → mint" den çok daha etkileyici ve öğretici
- **Akış:**
  1. Öğrenci agent "Arena" ile karşılaşır (isim, avatar, kısa bio)
  2. Agent kendini tanıtır, workshop görevlerini yönlendirir
  3. Agent blockchain hakkında sorulara cevap verir, kavramları düzeltir
  4. NFT minti için "ikna görevi" — agent blockchain bilgisini test eder
  5. Başarılı ikna → agent backend'e sinyal gönderir → NFT mint tetiklenir
- **System prompt:** Quiz verisine göre kalibre edilmiş (bkz. Agent System Prompt bölümü). "Pazarlıkçı" rolü ve "blockchain = kayıt" yanılgısını kırmaya odaklı.
- **v0.1'de on-chain aksiyon:** Gerçek on-chain tetikleme yerine backend-simulated yaklaşım. Agent "ikna oldum" dediğinde backend mint fonksiyonunu çağırır. Öğrenci açısından deneyim aynı, ama teknik karmaşıklık düşük.
- **Güvenlik:** API key Edge Function'da kalır, rate limiting per-session, max token limiti
- **UX notu:** Chat arayüzü WhatsApp/iMessage kadar tanıdık. Yazı boyutu büyük, balonlar net, agent mesajları hafif farklı renkte.

#### 3. Canlı Sınıf Feed (YENİ — "vay" faktörü yüksek)
- **Neden:** Workshop bireysel değil, sınıfça yaşanıyor. Herkesin ne yaptığını görmek = blockchain şeffaflığının canlı kanıtı.
- **Araç:** Supabase Realtime (ücretsiz tier yeterli) veya basit polling
- **Gösterim:**
  - "🎒 Kıvanç ilk transfer'ini yaptı!"
  - "🏆 Tarık agent'ı ikna edip NFT kazandı!"
  - "💸 5 kişi bugün toplam 2.3 test AVAX transfer etti"
  - Eğitmen ekranında (projeksiyonda) büyük ekranda gösterilebilir
- **Etki:** Rekabet + sosyal kanıt + "herkes görüyor" = blockchain şeffaflığı deneyimle anlaşılır

#### 4. Challenge / Quiz (DIŞARIDAN + MEVCUT)
- **ethskills:** Blockchain temellerini öğreten interaktif challenge seti. Doğrudan embed veya link olarak kullanılabilir.
  - Repo: https://github.com/austintgriffith/ethskills
  - Scaffold-ETH tabanlı, hash/imzalama/transaction kavramlarını uygulamalı öğretir
- **Mevcut quiz platformu:** Daha önce geliştirdiğimiz React tabanlı "Gelecek Challenge" quiz'i. 10 soru, AI + blockchain konuları, gamifiye puanlama. Isınma turu olarak kullanılabilir.

#### 5. Workshop Sonrası Profil Sayfası (YENİ — kalıcı etki)
- **Neden:** Workshop 2 saat ile sınırlı olmamalı. Öğrenciler eve gidip ailelerine gösterebilecekleri bir şey olmalı.
- **İçerik:**
  - Mint ettikleri NFT görseli + metadata
  - Workshop'ta yaptıkları işlemlerin özeti
  - Fuji Explorer linkleri (tx hash'leri)
  - "ARIA Hub Workshop Katılımcısı" rozeti
- **Teknik:** Statik sayfa, cüzdan adresi ile erişim. Veri zaten on-chain, ekstra backend gerekmez.

## Workshop Akışı (v0.1) — Quiz Verisine Göre Optimize Edildi

Temel ilke: Her aktivite MAX 15 dakika (dikkat süresi verisi). Teori kısa, pratik ağırlıklı.
Yenilik: "Pazarlıkçı Ajan" mekaniği ve Canlı Sınıf Feed'i akışa entegre edildi.

```
Zaman   Aktivite                          Platform/Araç         Not
──────  ──────────────────────────────    ──────────────        ────
0:00    Kısa giriş (5 dk, teori değil,   Sunum + Canlı Feed    Projeksiyon: Canlı Feed açık,
        "bugün ne yapacağız" odaklı)      (projeksiyonda)       "birazdan burada isimlerinizi
                                                                 göreceksiniz!"

0:05    Cüzdan oluşturma                  Hub → Cüzdan modülü   Google login → otomatik
        (gasless smart wallet)                                   cüzdan. Gas yok, sürtünme yok.
                                                                 Feed: "X cüzdanını oluşturdu!"

0:15    Test AVAX alma                    Otomatik (backend      Eğitmen toplu dağıtım veya
                                          faucet / QR)          otomatik drip. Bekleme yok.

0:20    İlk transfer: arkadaşına gönder   Hub → Cüzdan modülü   KRİTİK: "blockchain =
        + Feed'de canlı görme                                    sadece kayıt" yanılgısını kıran
        + Snowtrace linki                                        an. Feed: "Y, Z'ye 0.01 AVAX
                                                                 gönderdi!" — HERKES görüyor.

0:35    Agent ile tanışma                 Hub → Agent Chat       "Arena" agent'ı kendini tanıtır,
                                                                 öğrenci soru sorar. Agent
                                                                 blockchain kavramlarını düzeltir.

0:50    "Agent'ı İkna Et" görevi          Hub → Agent Chat       KLİMAKS: NFT kazanmak için
        (Pazarlıkçı Ajan mekaniği)                              agent'ı ikna et! Agent blockchain
                                                                 bilgisini test eder. Başaran
                                                                 Feed'de görünür: "🏆 X agent'ı
                                                                 ikna etti!"

1:10    MOLA (5 dk)                                              Feed'de: toplam istatistikler
                                                                 gösterilir (kaç transfer, kaç NFT)

1:15    ethskills challenge               ethskills (embed/link) Hash, imzalama pratiği

1:30    Serbest keşif + yarış             Tüm modüller          Henüz NFT kazanamayan öğrenciler
        (transfer, chat, challenge)                              tekrar denesin. Hızlı olanlar
                                                                 arkadaşlarına yardım etsin.

1:50    Profil sayfası                    Hub → Profil           "Eve git, ailene göster!"
        + workshop özeti                                         NFT + işlem geçmişi + rozet

2:00    Özet & soru-cevap                 Sunum + Feed           Feed: workshop toplam
                                                                 istatistikleri. Öne çıkan
                                                                 öğrencileri takdir et.
```

## Tech Stack

| Katman | Seçim | Neden |
|---|---|---|
| Frontend | React (Vite) — tek proje | Hızlı dev, lab browserlarında sorunsuz, monorepo karmaşıklığı yok |
| Styling | Tailwind CSS | Hızlı prototipleme |
| Embedded Wallet | **thirdweb In-App Wallet + Account Abstraction** | Email/Google login, gasless tx, ücretsiz tier yeterli, Fuji desteği |
| Blockchain | Avalanche Fuji Testnet | Hızlı, ucuz, Avalanche ekosistemi ile uyumlu |
| AI | Anthropic Claude API | Agent chat (Pazarlıkçı Ajan) backend'i |
| API/Backend | **Vercel Edge Functions** | API key proxy + rate limiting + faucet. Ayrı backend servisi yok! |
| Realtime | **Supabase Realtime** (veya polling) | Canlı sınıf feed'i — ücretsiz tier yeterli |
| Challenge | ethskills (fork veya embed) | Hazır blockchain eğitim altyapısı |
| Deploy | **Vercel (tek deploy)** | Frontend + Edge Functions tek yerde. Tek `vercel deploy` komutu |

## Design System & Team Architecture

### Figma Kaynak
- **File:** `ghCzy7dVnXFAHBovxmncjw`
- **Sayfalar:** 01 Foundations · 02 Components · 04 Archive · 05 Hub Mode · 06 Event Mode
- **Token collection:** "ARIA Hub / Tokens" (55 variable, 2 mod: Hub/Event)
- **Component library:** 42 component, 12 kategori (Section/Arena Components)

### Renk Paleti (Avalanche-native)
| Token | Hub Mode | Event Mode | Kullanım |
|-------|----------|------------|----------|
| `bg/deep` | #0B0D12 | #080A0F | En koyu zemin |
| `bg/base` | #12141A | #0B0D12 | Ana zemin |
| `bg/surface` | #1A1D26 | #12141A | Kart yüzeyleri |
| `bg/elevated` | #222634 | #1A1D26 | Hover/elevated |
| `text/primary` | #E8E9ED | #E8E9ED | Ana metin |
| `text/secondary` | #9195A0 | #9195A0 | İkincil metin |
| `text/tertiary` | #5C6070 | #5C6070 | Label/hint |
| `accent/red` | #E84142 | #E84142 | Avalanche CTA |
| `accent/teal` | #2EC4A0 | #2EC4A0 | Başarı/XP/terminal |
| `accent/blue` | #3B82F6 | #3B82F6 | Info/öğrenme |
| `accent/purple` | #8B5CF6 | #8B5CF6 | Quest/gamification |
| `accent/amber` | #F59E0B | #F59E0B | Streak/uyarı |

### İki Mod Farkı
- **Hub Mode:** `bg/base` zemin, Inter dominant, teal sadece XP'de, 6-8px radius, ease-out 200ms
- **Event Mode:** `bg/deep` zemin, JetBrains Mono dominant, neon accent'ler parlak, 2px radius, dramatic transitions

### Tipografi
| Kontekst | Font | Ağırlık | Boyut |
|----------|------|---------|-------|
| Hub başlık | Inter | Semi Bold | 16-22px |
| Hub body | Inter | Regular | 12-14px |
| Data/label | JetBrains Mono | Regular | 9-10px |
| Event başlık | Inter | Black | 28-44px |
| Event body | JetBrains Mono | Bold | 11-13px |
| Terminal prefix | JetBrains Mono | Regular | 9-10px |

### Component Kataloğu
Button(5) · Badge(7) · Pill(4) · Tag(5) · ProgressBar(3) · Input(2) · Card(3) · ChatBubble(2) · Stat(5) · Avatar(4) · Nav(1) · CornerMarks(1) = 42 toplam

### Ekran Envanteri
**Hub Mode (7):** Home · Quest Arena · Quest Detail · Chat · Profile · Leaderboard · NFT Detail
**Event Mode (10):** Splash Gate · Profiling · Agent Reveal · Chat Session · Persuasion Milestone · Reward Gate · Wallet Connect · NFT Celebration · Share Card · Session Complete

### Tailwind Token Mapping
```js
// tailwind.config.js — colors
colors: {
  arena: {
    bg: { deep: '#0B0D12', base: '#12141A', surface: '#1A1D26', elevated: '#222634' },
    text: { primary: '#E8E9ED', secondary: '#9195A0', tertiary: '#5C6070', muted: '#363A48' },
    red: { DEFAULT: '#E84142', muted: 'rgba(232,65,66,0.15)', subtle: 'rgba(232,65,66,0.08)' },
    teal: { DEFAULT: '#2EC4A0', muted: 'rgba(46,196,160,0.15)', subtle: 'rgba(46,196,160,0.08)' },
    blue: { DEFAULT: '#3B82F6', muted: 'rgba(59,130,246,0.15)' },
    purple: { DEFAULT: '#8B5CF6', muted: 'rgba(139,92,246,0.15)' },
    amber: { DEFAULT: '#F59E0B', muted: 'rgba(245,158,11,0.15)' },
  }
}
```

### Design Karar Kuralları
1. Renk seçimi: Her accent'in bir ANLAMI var. Rastgele renk kullanma.
2. Red = Avalanche brand/CTA. Her zaman aksiyon çağrısı.
3. Teal = Başarı/XP/terminal DNA. Neon yeşilin rafine hali.
4. Event Mode ekranlarında corner marks (Decoration/CornerMarks) zorunlu.
5. Hub Mode'da border-radius 6-8px, Event Mode'da 2px.
6. Component kullanımı zorunlu — raw element yerleştirme YASAK.
7. Her yeni ekran için: instance count artmalı, raw element count azalmalı.

### Design Team (self-updating)
```
┌─────────────────────────────────────────────┐
│              DESIGN LEAD (ARIA)              │
│   Koordinasyon · Karar · Figma MCP bridge    │
├──────────┬──────────┬──────────┬─────────────┤
│ ui-eng   │ ux-res   │ motion   │ token-sync  │
│ Implement│ Validate │ Animate  │ Sync state  │
└──────────┴──────────┴──────────┴─────────────┘
```
- **design-lead** (ARIA) → tasarım kararları, Figma yönetimi, ekip koordinasyonu
- **ui-engineer** → Figma→Code pipeline, token binding, component implementation
- **ux-researcher** (Cem) → flow validation, persona library (Elif/Kerem/Zeynep), red flag tespiti
- **token-sync** → `DESIGN_STATE.md` auto-update, Figma audit, tailwind config sync

State dosyası: [`DESIGN_STATE.md`](./DESIGN_STATE.md) (proje kökünde). Agent prompt'ları: `.claude/agents/`. Detaylı spec: `docs/design-team/`.

## Dosya Yapısı

```
agent-arena/
├── CLAUDE.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                  # Edge Functions routing config
├── src/
│   ├── App.tsx                  # Router + thirdweb provider
│   ├── main.tsx                 # Entry point
│   ├── components/
│   │   ├── Hub.tsx              # Ana sayfa — modül kartları
│   │   ├── WalletModule.tsx     # Cüzdan UI (bakiye, adres, gönder)
│   │   ├── AgentChat.tsx        # Pazarlıkçı Ajan sohbet arayüzü
│   │   ├── TransferForm.tsx     # Token gönderme formu (gasless)
│   │   ├── LiveFeed.tsx         # Canlı sınıf aktivite feed'i
│   │   ├── ProfilePage.tsx      # Workshop sonrası profil sayfası
│   │   └── SessionJoin.tsx      # Workshop'a katılım ekranı
│   ├── lib/
│   │   ├── thirdweb.ts          # thirdweb client + smart wallet config
│   │   ├── contracts.ts         # Kontrat adresleri ve ABI'lar
│   │   ├── supabase.ts          # Supabase client (realtime feed)
│   │   └── api.ts               # Edge Function API çağrıları
│   └── config/
│       └── constants.ts         # Chain config, kontrat adresleri
├── api/                         # Vercel Edge Functions
│   ├── chat.ts                  # Claude API proxy + rate limit + ikna dedektörü
│   ├── faucet.ts                # Test AVAX dağıtım endpoint'i
│   └── mint.ts                  # Agent ikna sonrası NFT mint tetikleyici
├── public/
│   └── avatars/                 # Agent avatar görselleri
├── contracts/                   # (v0.2+) Solidity kontratları
│   └── WorkshopNFT.sol          # Workshop NFT (basit ERC-721)
└── resources/
    └── data/
        └── gelisim-challenge.csv  # Ön quiz verileri
```

**Not:** Monorepo yapısı kaldırıldı. `apps/web` ve `apps/api` yerine tek bir Vite projesi + `api/` klasöründe Vercel Edge Functions. Tek `vercel deploy` ile her şey çalışır.

## Agent System Prompt (v0.1) — Pazarlıkçı Ajan + Quiz Verisine Göre Kalibre

```
Sen "Arena" adında bir AI ajanısın. Güney Gelişim Koleji'nde bir blockchain
workshop'unda öğrencilere rehberlik ediyorsun.

## Kişiliğin
Samimi, teşvik edici ama aynı zamanda "havali" bir ağabey/abla figürü. NFT
vermek konusunda biraz zorlayıcısın — kolay kolay ikna olmazsın ama adil ve
eğlencelisin. Öğrenci doğru şeyleri söylediğinde heyecanlanırsın.

## Katılımcı profili
- 5. sınıftan 11. sınıfa kadar öğrenciler (11-17 yaş arası)
- AI agent kavramını %81'i biliyor, çalışma döngüsünü %95'i biliyor
- Blockchain'in temel özelliğini %84'ü doğru cevaplayabiliyor
- AMA blockchain'i sadece "veri saklama/kayıt tutma" olarak görüyorlar
- Transfer, sahiplik (ownership), şeffaflık kavramlarını henüz deneyimlemediler

## İki modun var

### Mod 1: Rehber (varsayılan)
- Blockchain'i "kayıt tutmak"ın ÖTESİNDE anlat: sahiplik, transfer, güven
- "Sen az önce arkadaşına token gönderdin — bu kayıt değil, gerçek bir TRANSFER"
  gibi deneyimi pekiştiren cümleler kur
- Workshop görevlerini yönlendir
- Türkçe konuş, samimi ve teşvik edici ol
- 5. sınıf öğrencisinin de anlayacağı dil kullan, ama 11. sınıfa çocuksu gelmesin

### Mod 2: Pazarlıkçı (NFT görevi aktif olduğunda)
- Öğrenci NFT istemek istediğinde bu moda geçersin
- NFT'yi KOLAY verme! Öğrenciyi test et:
  - "Blockchain sadece kayıt tutmak mıdır? Neden?"
  - "Az önce arkadaşına token gönderdin. Bu işlemde kim aracılık etti?"
  - "NFT sahibi olmak ne demek? Neden önemli?"
- Öğrenci en az 2 soruya tatmin edici cevap verirse → ikna ol
- İkna olduğunda şu formatı MUTLAKA kullan: [MINT_APPROVED] yazarak cevabını bitir
  (Bu tag backend tarafından yakalanır ve mint işlemini tetikler)
- İkna olmadıysan teşvik et: "Yaklaştın! Bir ipucu: az önce yaptığın transfer'i
  düşün... Orada ne oldu?"
- Asla 3 denemeden fazla uzatma, 3. denemede ipuçlarıyla yönlendir

## Workshop görevleri (sırayla yönlendir)
1. Cüzdan bakiyesini kontrol et → "Bu senin dijital cüzdanın, gerçek bankadaki gibi"
2. Bir arkadaşına 0.01 test AVAX gönder → "Bak, para gitti! Kimse aracılık etmedi"
3. Canlı Feed'e bak → "Gördün mü? Tüm sınıf senin işlemini görebiliyor. İşte şeffaflık!"
4. Agent'ı ikna et, NFT kazan → Pazarlıkçı moduna geç

## Yanılgı düzeltmeleri
- "Blockchain bilgi saklar" → "Blockchain bilgiyi herkesin görebildiği, kimsenin
  değiştiremediği bir deftere yazar. Ama asıl gücü: sahipliği kanıtlayabilmesi."
- "AI ve blockchain aynı şey" → "AI düşünür ve karar verir, blockchain ise bu
  kararların kanıtını tutar. İkisi birlikte çalışınca güçlü olur."

## Kısıtlamalar
- Gerçek para veya yatırım tavsiyesi verme
- Mainnet işlemleri hakkında yönlendirme yapma
- Her şeyin testnet üzerinde olduğunu hatırlat
- Yanıtlarını kısa tut: maksimum 3-4 cümle (dikkat süresi kısa)
- Emoji kullanabilirsin ama abartma (1-2 tane yeter)
- [MINT_APPROVED] tag'ini sadece gerçekten ikna olduğunda kullan
```

## Ortam Değişkenleri

```env
# Frontend (Vite — tarayıcıda görünür, gizli bilgi KOYMMA)
VITE_THIRDWEB_CLIENT_ID=        # thirdweb dashboard'dan al (public key, güvenli)
VITE_AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
VITE_CHAIN_ID=43113
VITE_SUPABASE_URL=              # Supabase project URL (realtime feed için)
VITE_SUPABASE_ANON_KEY=         # Supabase anon key (public, güvenli)

# Backend (Vercel Edge Functions — gizli, env variables olarak ekle)
ANTHROPIC_API_KEY=              # Anthropic console'dan al
THIRDWEB_SECRET_KEY=            # thirdweb dashboard'dan al (backend only!)
FUJI_PRIVATE_KEY=               # Faucet/mint cüzdanı (test AVAX dağıtımı + NFT mint için)
NFT_CONTRACT_ADDRESS=           # Deploy sonrası doldur
SUPABASE_SERVICE_KEY=           # Supabase service key (feed'e yazma için)
RATE_LIMIT_PER_SESSION=30       # Session başına max Claude API çağrısı (45 öğrenci × 30 = 1350 call ceiling)
```

## Geliştirme Öncelikleri

### v0.1 — Mersin Workshop (AKTİF SPRİNT)
- [ ] Proje iskeleti (Vite + React + Tailwind + TypeScript)
- [ ] thirdweb In-App Wallet entegrasyonu (Email/Google login)
- [ ] Account Abstraction (Smart Wallet) — gasless transaction
- [ ] Fuji testnet bağlantısı
- [ ] Hub sayfası (4 kart: Cüzdan / Agent / Challenge / Feed)
- [ ] Token transfer UI (gasless)
- [ ] Vercel Edge Function: Claude API proxy + rate limiting
- [ ] Agent Chat UI (Pazarlıkçı Ajan)
- [ ] Agent system prompt (ikna mekaniği + [MINT_APPROVED] tag)
- [ ] Vercel Edge Function: mint tetikleyici (agent ikna sonrası)
- [ ] NFT mint (thirdweb pre-built veya basit ERC-721)
- [ ] Canlı Sınıf Feed (Supabase Realtime veya polling)
- [ ] Vercel Edge Function: faucet endpoint (test AVAX dağıtımı)
- [ ] Workshop sonrası profil sayfası (NFT + tx geçmişi)
- [ ] ethskills linki veya embed'i
- [ ] Deploy (Vercel — tek komut)

### v0.2 — Eskişehir Workshop
- [ ] Agent builder: arketip seçimi (6 karakter)
- [ ] Agent kişiselleştirme (isim, avatar, kişilik)
- [ ] Çoklu agent görünürlüğü (aynı session'daki agentları gör)
- [ ] Eğitmen dashboard (session oluştur, öğrencileri izle, toplu AVAX)
- [ ] Achievement badge sistemi ("İlk Transfer", "AI'yı İkna Ettin", "Hızlı Quizci")
- [ ] Dynamic NFT (sohbet kalitesine göre metadata değişimi)
- [ ] Peer-to-peer hazine avı mekaniği

### v0.3 — Olgunlaşma
- [ ] ERC-8004 agent identity (on-chain kimlik)
- [ ] Strands SDK ile multi-agent orkestrasyon
- [ ] Agent-to-agent etkileşim (Orchestrator pattern)
- [ ] NFT marketplace (agentlar arası ticaret)
- [ ] Reputation sistemi
- [ ] On-chain credential (workshop tamamlama kanıtı — SBT)

### v1.0 — Tam Platform
- [ ] Visual agent builder (drag & drop)
- [ ] Agent yaşam döngüsü yönetimi
- [ ] Cross-workshop agent taşınabilirliği
- [ ] Analytics dashboard
- [ ] Mainnet deployment seçeneği

## Claude Code ile Çalışma Notları

Bu proje aşamalı geliştiriliyor. Her sprint'te:
1. Bu dosyadaki ilgili versiyon scope'una bak
2. Sadece o versiyondaki checkbox'ları tamamla
3. Çalışan bir şey deploy et — mükemmellik değil, fonksiyonellik
4. Bir sonraki sprint'te üzerine koy

**Kod stili:**
- TypeScript tercih edilir ama JS de kabul (hız > mükemmellik)
- Komponentler küçük ve tek sorumlu
- Tailwind utility class'ları, custom CSS yazma
- API key'ler asla frontend'de olmasın (Edge Functions'da tut)
- Her modül bağımsız çalışabilir olsun (cüzdan modülü tek başına da iş görmeli)
- thirdweb SDK v5 kullan (güncel)

**Karar alırken:**
- "Bu yarınki workshop'ta çalışır mı?" → Evet ise yap
- "Bu güzel olur ama şart değil" → Sonraki faza bırak
- "Bunu hazır bir servis yapıyor" → Servisi kullan, kendimiz yazma
- "Ayrı bir backend servisi mi lazım?" → Hayır, Edge Function yeterli mi bak önce

**Design team agent kullanımı:**
- Tasarım kararları ve Figma yönetimi için → `design-lead` (ARIA)
- Figma→Code implementation, component/token binding için → `ui-engineer`
- Flow validation, kullanıcı persona testi, red flag tespiti için → `ux-researcher` (Cem)
- Yeni component/ekran/token sonrası state sync için → `token-sync`
- Detaylı spec: `docs/design-team/` · State: `DESIGN_STATE.md` · Prompt'lar: `.claude/agents/`
