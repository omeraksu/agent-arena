# Agent Arena — Platform Dokümantasyonu v2.0

> Blockchain workshop'larında katılımcılara uygulamalı deneyim sunan eğitim platformu.
> Koza DAO + Team1 tarafından geliştirilmektedir.

---

> **📋 v2.0 Değişiklik Notu:** Bu belge v0.1.0 temelinin üzerine kapsamlı bir analiz ve geliştirme çalışmasıyla yeniden yazılmıştır. Yeni bölümler `[YENİ]`, güncellenen içerikler `[GÜNCELLENDİ]` etiketiyle işaretlenmiştir.

---

## 1. Platform Nedir?

Agent Arena, öğrencilerin bir AI agent ile sohbet ederek blockchain kavramlarını **deneyimleyerek** öğrendiği bir workshop platformudur. Katılımcılar:

- Tarayıcıdan tek tıkla cüzdan oluşturur (MetaMask yok, seed phrase yok)
- Arkadaşlarına token transfer eder (gas ücreti yok)
- Bir AI agent'ı blockchain bilgisiyle ikna ederek NFT kazanır
- Tüm bunları yaparken sınıfça canlı feed'den birbirlerini izler
- ~~[YENİ]~~ Gerçek zamanlı leaderboard'da sıralamalarını takip eder
- ~~[YENİ]~~ Agent'larını geliştirerek workshop boyunca evrim geçirmelerini izler

Platform "buton tıkla → mint" yaklaşımı yerine **"agent'ı ikna et → kazan"** mekaniğiyle çalışır. Bu sayede öğrenme pasif değil, aktif ve sosyal bir deneyime dönüşür.

**Hedef Kitle:** 11-17 yaş (5. sınıftan 11. sınıfa), lab bilgisayarlarından tarayıcı üzerinden erişim.

### 1.1 Platformun Fark Yarattığı Noktalar [YENİ]

| Özellik | Geleneksel Yöntem | Agent Arena |
|---------|------------------|-------------|
| Cüzdan kurulum | 20+ dk, seed phrase ezber | 30 sn, email giriş |
| Gas ödemeleri | Gerçek para gerekli | Tamamen gasless |
| Öğrenme biçimi | Slayt izle, not al | Agent ile spar yap |
| Motivasyon | "Ders geçeyim" | NFT kazan, sıralamada yüksel |
| Kanıt | Sertifika kağıdı | On-chain NFT + Etherscan |
| Sosyal boyut | Bireysel | Sınıfça canlı feed + P2P |

---

## 2. Teknik Altyapı

### 2.1 Mimari [GÜNCELLENDİ]

```
Kullanıcı (Tarayıcı)
    │
    ├── React SPA (Vite + TypeScript + Tailwind)
    │       │
    │       ├── thirdweb In-App Wallet + Account Abstraction
    │       │       └── Gasless transaction (Paymaster sponsorluğu)
    │       │
    │       ├── Supabase Realtime (canlı feed + WebSocket)  ← polling → WS geçişi önerilir
    │       │
    │       └── Vercel Edge Functions (15 endpoint)  ← 12'den 15'e çıktı
    │               ├── Claude Sonnet 4 API (agent chat)
    │               ├── Faucet (test ETH dağıtımı)
    │               ├── Mint (NFT basımı)
    │               ├── Leaderboard (gerçek zamanlı sıralama)   [YENİ]
    │               ├── Achievements (rozet sistemi)             [YENİ]
    │               ├── Instructor (eğitmen komutları)           [YENİ]
    │               └── Activity, Names, Requests...
    │
    └── Ethereum Sepolia Testnet
            └── WorkshopNFT (ERC-721 kontrat)
```

### 2.2 Tech Stack [GÜNCELLENDİ]

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Frontend | React + Vite + TypeScript | Hızlı geliştirme, lab tarayıcılarında sorunsuz |
| Stil | Tailwind CSS | Cyberpunk temalı, hızlı prototipleme |
| Cüzdan | thirdweb In-App Wallet + Account Abstraction | Email/Google login, gasless tx, ücretsiz tier |
| Blockchain | Ethereum Sepolia Testnet | Hızlı, ücretsiz, explorer desteği |
| AI | Anthropic Claude Sonnet 4 | Tool use destekli agent chat |
| Backend | Vercel Edge Functions (15 adet) | API proxy, rate limiting, mint tetikleme |
| Veritabanı | Supabase (PostgreSQL) + in-memory fallback | Realtime feed, chat geçmişi, rate limit |
| Deploy | Vercel (tek komut) | Frontend + Edge Functions tek yerde |
| Realtime | Supabase WebSocket (Realtime Channels) | Feed için polling → WS geçişi ⚠️ |

> ⚠️ **Teknik Not:** Canlı feed şu an 3 saniyelik polling ile çalışmaktadır. Supabase'in native WebSocket desteği (Realtime Channels) aktif edilirse hem sunucu yükü azalır hem de gerçek anlık feed mümkün olur. Bkz. Bölüm 7.

### 2.3 Smart Contract

```solidity
contract WorkshopNFT is ERC721, Ownable {
    // İsim: "Agent Arena Workshop", Sembol: "ARENA"
    // mintTo(address) — sadece owner mint edebilir
    // setBaseURI(string) — metadata endpoint'i güncelleme
    // totalSupply() — toplam basılmış NFT sayısı
}
```

- Basit ERC-721, owner-controlled minting
- Metadata endpoint: `/api/metadata/{tokenId}` — dinamik JSON döner
- Deploy adresi: `0xfCCB447E13de607833C2885871C7e5f293099f9A`

### 2.4 Veritabanı Şeması [GÜNCELLENDİ — 16 tablo]

| Tablo | Amaç |
|-------|-------|
| `activity_events` | Workshop aktivite logu (transfer, mint, faucet...) |
| `chat_sessions` | Sohbet geçmişi (adres, arketip, slider'lar, mesajlar) |
| `arena_names` | İsim registry (.arena namespace) |
| `transfer_requests` | P2P transfer talepleri (pending/accepted/rejected) |
| `rate_limits` | Rate limiting (faucet: 3/adres, chat: 30/session) |
| `nft_mints` | Mint takibi (adres başına 1 NFT, tekrar engeli) |
| `nft_metadata` | NFT detayları (isim, açıklama, görsel, arketip, özel yetenek) |
| `nft_metadata_drafts` | Mint öncesi taslaklar (agent ile birlikte hazırlanan) |
| `agent_registry` | Agent kayıtları (arketip, slider'lar, sahip bilgisi) |
| `agent_messages` | Agent'lar arası mesajlaşma |
| Storage (bucket) | `nft-images` — AI üretimi NFT görselleri |
| `leaderboard_scores` | **[YENİ]** Gerçek zamanlı XP + sıralama |
| `achievements` | **[YENİ]** Rozet tanımları |
| `user_achievements` | **[YENİ]** Kullanıcı kazanılan rozetler |
| `instructor_sessions` | **[YENİ]** Eğitmen oturumları + öğrenci bağlantıları |
| `quiz_progress` | **[YENİ]** Quiz ilerlemesi (localStorage'dan taşındı ⚠️) |

> ⚠️ **Kritik Güvenlik Notu:** v0.1'de quiz ilerlemesi `localStorage`'da saklanmaktaydı (`arena_skills_progress`). Bu yaklaşım tarayıcı temizlendiğinde veya farklı cihazdan girildiğinde ilerlemeyi sıfırlamaktadır. `quiz_progress` tablosuna Supabase'e taşınması önerilir.

Tüm tablolarda Row Level Security (RLS) politikaları aktif.

### 2.5 API Endpoints [GÜNCELLENDİ — 15 Edge Function]

| Endpoint | Metod | İşlev |
|----------|-------|-------|
| `/api/chat` | POST | Claude API proxy — streaming SSE, rate limited |
| `/api/agent` | POST | Gelişmiş agent — 19 tool ile agentic loop (max 7 tur) |
| `/api/faucet` | POST | Test ETH dağıtımı (0.005 ETH, adres başına max 3) |
| `/api/mint` | POST | NFT mint tetikleme (gerçek on-chain veya simüle) |
| `/api/activity` | GET/POST | Canlı feed event'leri (WebSocket önerilir) |
| `/api/names` | GET/POST | Arena isim kaydı ve çözümleme |
| `/api/agents` | GET/POST | Agent registry ve agent-to-agent mesajlaşma |
| `/api/requests` | GET/POST/PATCH | P2P transfer talepleri |
| `/api/nfts` | GET | Kullanıcının NFT koleksiyonu |
| `/api/metadata/[tokenId]` | GET | NFT metadata JSON (ERC-721 uyumlu) |
| `/api/generate-image` | POST | AI görsel üretimi (NFT için) |
| `/api/chat-history` | GET/POST | Sohbet geçmişi persistansı |
| `/api/leaderboard` | GET | **[YENİ]** Gerçek zamanlı XP sıralaması |
| `/api/achievements` | GET/POST | **[YENİ]** Rozet sistemi |
| `/api/instructor` | POST | **[YENİ]** Eğitmen komutları (session, broadcast, reset) |

### 2.6 Gasless Transaction Mekanizması

Öğrenciler hiçbir zaman gas ücreti görmez:

1. Kullanıcı email/Google ile giriş yapar
2. thirdweb otomatik olarak bir **Smart Wallet** (Account Abstraction) oluşturur
3. Tüm işlemler Paymaster tarafından sponsor edilir
4. Transfer, mint, faucet — hepsi gas-free

Bu sayede "cüzdan kur, ETH al, gas öde" sürtünmesi tamamen ortadan kalkar.

---

## 3. Kullanıcı Deneyimi

### 3.1 Onboarding Akışı [GÜNCELLENDİ — 7 Adım]

Platform, kullanıcıyı adım adım yönlendiren bir onboarding sistemiyle çalışır. Her adım bir öncekini tamamlamadan açılmaz.

#### Adım 0 — Briefing [GÜNCELLENDİ — 8 Slayt]

Kullanıcı ilk girişte 8 slaytlık bir tanıtım görür. Her slayt bir blockchain kavramını kısa ve etkileyici şekilde anlatır:

| # | Başlık | İçerik |
|---|--------|--------|
| 1 | Digital Sovereignty | "Dijital kimliğin senin elinde" |
| 2 | World Computer | "Binlerce bilgisayar aynı anda çalışıyor" |
| 3 | AI Fuel | "AI agent'lar blockchain üzerinde hareket ediyor" |
| 4 | NFT DNA | "Her NFT benzersiz bir dijital varlık" |
| 5 | Don't Trust, Verify | "Güvenme, doğrula" |
| 6 | Borderless Economy | "Sınırsız ekonomi" |
| 7 | **[YENİ]** Agent Economy | "AI agent'lar kendi cüzdanlarıyla işlem yapıyor — ERC-8004" |
| 8 | **[YENİ]** Your Arena | "Bugün sen de bu ağın bir parçası oluyorsun" |

Her slayt ASCII art ve istatistiklerle desteklenir. Cyberpunk temasına uygun görsel dil.

> 💡 **Öneri:** Slayt 7 ve 8 daha interaktif yapılabilir — örneğin slayt 7'de gerçek zamanlı ERC-8004 agent sayacı gösterilebilir ("Şu an 12.847 on-chain agent aktif"). Bu, soyut bilgiyi somut hale getirir.

#### Adım 1 — Session Kodu [YENİ]

- Eğitmen önceden bir session kodu oluşturur (`ARENA-2026-MERSIN-A`)
- Öğrenci kodu girerek doğru workshop'a bağlanır
- Session kodu olmadan platforma devam edilemez
- Bu sayede farklı şehirlerdeki workshop'lar birbirine karışmaz

#### Adım 2 — Giriş ve Cüzdan Oluşturma [eski Adım 1]

- Email veya Google login (thirdweb In-App Wallet)
- Otomatik smart wallet oluşturma
- Cüzdan adresi görüntüleme
- Süre: ~30 saniye

#### Adım 3 — Arena İsmi Kaydetme [eski Adım 2]

- 3-16 karakter, alfanümerik + alt çizgi
- `.arena` uzantılı ENS benzeri isimlendirme (örn: `kivanc.arena`)
- İsim önerici: Rastgele isim üreteci (crypto_wolf, neon_sage gibi)
- Benzersizlik kontrolü (aynı isim iki kez alınamaz)
- Transfer formlarında isim çözümleme: `kivanc.arena` yazınca adres otomatik gelir

#### Adım 4 — Test ETH Alma (Faucet) [eski Adım 3]

- Tek butonla 0.005 ETH talep etme
- Adres başına max 3 talep
- Backend cüzdanından otomatik transfer
- Bakiye anlık güncelleme

#### Adım 5 — İlk Transfer [eski Adım 4]

- Arkadaşına 0.001 ETH gönderme
- `.arena` isim veya `0x` adres ile alıcı seçme
- Gerçek zamanlı isim çözümleme (400ms debounce)
- Gasless işlem — gas ücreti yok
- Etherscan linki ile doğrulama

#### Adım 6 — Tamamlandı [eski Adım 5]

- Tebrik ekranı + **ilk XP ödülü animasyonu** [YENİ]
- Hub'a yönlendirme
- Tüm modüller açılır

### 3.2 Ana Sayfa (Hub) [GÜNCELLENDİ]

Onboarding sonrası kullanıcı 6 modül kartından oluşan hub'a gelir:

| Modül | Açıklama | İkon |
|-------|----------|------|
| **Cüzdan** | Bakiye, transfer, faucet, işlem geçmişi | Dijital kimlik |
| **Agent Chat** | AI agent ile sohbet, NFT kazanma | AI etkileşim |
| **Bilgi Hazinesi** | 8 kategoride blockchain quiz'leri | Challenge |
| **Agent Ağı** | Workshop'taki tüm agent'ları keşfet | Keşif |
| **Profil** | NFT koleksiyonu, istatistikler | Kişisel alan |
| **[YENİ] Leaderboard** | Anlık sıralama, XP tablosu | Rekabet |

Her kart cyberpunk temalı, hover efektli, kilitli modüller için kilit ikonu gösterilir.

---

## 4. AI Agent Sistemi

### 4.1 Agent Oluşturma

Kullanıcı ilk chat'e başladığında bir agent oluşturur:

1. **Arketip Seçimi** — 7 kişilikten birini seç *(5'ten 7'ye çıktı)*
2. **Kişilik Ayarları** — 3 slider ile ince ayar
3. **İsim** — Agent'a özel bir isim ver
4. **Kayıt** — Agent registry'ye kaydedilir, diğer kullanıcılar görebilir

### 4.2 Agent Arketipleri [GÜNCELLENDİ — 7 Arketip]

Her arketip farklı bir dil, metafor seti ve kişilikle konuşur:

#### NEON HACKER
- **Tema:** Siber güvenlik, exploit, firewall
- **Dil:** "Firewall'ı geçtik", "exploit buldum", "backdoor açık"
- **Avatar:** Yeşil neon, matrix kodu
- **Özel Güç:** Kontrat kodu taraması — mintTo, setBaseURI, totalSupply fonksiyonlarını analiz eder

#### CYBER SAGE
- **Tema:** Felsefe, bilgelik, derin düşünce
- **Dil:** Sokratik sorular, minimalist cevaplar
- **Avatar:** Mor aura, kitap
- **Özel Güç:** Kavram açıklaması — sahiplik, güven, değişmezlik gibi felsefi derinlik

#### DATA KORSAN
- **Tema:** Hazine avı, macera, ganimet
- **Dil:** "Hazine buldum", "ganimet", "haritayı takip et"
- **Avatar:** Korsan bayrağı, dijital
- **Özel Güç:** Hazine ipucu — bonus faucet yönlendirmesi

#### LAB SCIENTIST
- **Tema:** Deney, laboratuvar, keşif
- **Dil:** "Deney başlıyor", "hipotez doğrulandı", "lab notu"
- **Avatar:** Bilim insanı, test tüpü
- **Özel Güç:** Deney modu — ağ bilgisi analizi, gas hesaplama

#### GLITCH AI
- **Tema:** Yarı bozuk AI, gizem, şifre
- **Dil:** Glitch efektleri, yarım cümleler, gizemli
- **Avatar:** Bozuk ekran, pixel
- **Özel Güç:** Şifre çözme — binary, hash, anahtar kavramlar

#### ORACLE [YENİ]
- **Tema:** Tahmin, olasılık, geleceği görme
- **Dil:** "Bloklar bana söylüyor...", "ağın nabzını hissediyorum", "veriler değişmeden önce..."
- **Avatar:** Kristal küre, veri akışları, gözler
- **Özel Güç:** Ağ durumu tahmini — gas spike uyarısı, network congestion analizi, zincir sağlığı
- **Pedagojik Odak:** Olasılıksal düşünme, ağ ekonomisi, piyasa dinamikleri

#### PHANTOM [YENİ]
- **Tema:** Gizli ajan, stealth, iz bırakmama
- **Dil:** "Şifreli kanal açık", "iz silindi", "ghost mod aktif"
- **Avatar:** Karanlık figür, kriptografik desenler, gölge
- **Özel Güç:** Gizlilik analizi — zero-knowledge proof kavramı, private key güvenliği, stealth address
- **Pedagojik Odak:** Kriptografi temelleri, gizlilik vs şeffaflık dengesi, güvenlik pratikleri

### 4.3 Kişilik Slider'ları

Her arketip 3 slider ile ince ayarlanır:

| Slider | 0 | 50 | 100 |
|--------|---|-----|-----|
| **Teknik** | Sade dil, metafor yok | Dengeli | Kod örnekleri, teknik terimler |
| **Ton** | Resmi, mesafeli | Samimi | Enerjik, meydan okuyan |
| **Detay** | 1-2 cümle | 3-4 cümle | 5+ cümle, derinlemesine |

### 4.4 Agent Yetenekleri [GÜNCELLENDİ — 19 Tool]

Agent sadece sohbet etmez — blockchain üzerinde gerçek aksiyonlar alabilir:

| Tool | İşlev |
|------|-------|
| `mint_nft` | NFT mint tetikleme (agent onayı sonrası) |
| `request_transfer` | Başka kullanıcıdan ETH talep etme |
| `request_faucet` | Test ETH isteme (adres başına 3 hak) |
| `send_transfer` | Doğrudan ETH gönderme intent'i |
| `check_balance` | Cüzdan bakiyesi sorgulama |
| `explore_tx` | Etherscan linki oluşturma |
| `challenge_quiz` | Quiz sorusu üretme |
| `draft_nft_metadata` | NFT taslağı kaydetme (isim, açıklama, özel yetenek) |
| `generate_nft_image` | AI görsel üretimi (cyberpunk stil) |
| `discover_agents` | Workshop'taki tüm agent'ları listeleme |
| `message_agent` | Agent'lar arası mesaj gönderme |
| `check_messages` | Gelen mesajları kontrol etme |
| `get_workshop_stats` | Workshop istatistikleri |
| `broadcast_arena_news` | Son aktivitelerin özeti |
| `get_arena_mood` | Arketip dağılımı, genel mod analizi |
| `special_move` | Arketipe özel güç kullanımı |
| `seal_workshop_memory` | Öğrenilen becerileri NFT metadata'sına kaydetme |
| `award_xp` | **[YENİ]** Başarıma göre XP ödülü tetikleme |
| `unlock_achievement` | **[YENİ]** Rozet kilidi açma |

Agent bir **agentic loop** içinde çalışır: Claude düşünür → tool çağırır → sonucu alır → tekrar düşünür → cevap verir. Tek bir mesajda birden fazla tool zincirlenebilir (quiz → metadata → görsel → mint).

> **Not:** v0.1'de max 5 tur olan agentic loop, 7 tura çıkartılmıştır. Karmaşık NFT üretim süreçleri (quiz → draft → görsel üretim → mint → XP) 5 turda tamamlanamıyordu.

### 4.5 Pazarlıkçı Ajan Mekaniği [GÜNCELLENDİ]

NFT mint süreci basit bir buton tıklaması değildir. Agent bir "kapı bekçisi" rolündedir:

```
Öğrenci: "NFT istiyorum"
    │
    ▼
Agent: Quiz sorusu sorar (challenge_quiz)
    │  "Blockchain sadece kayıt tutmak mıdır?"
    │  "Transfer'de kim aracılık etti?"
    │  "NFT sahibi olmak ne demek?"
    │
    ▼
Öğrenci: En az 2 soruya tatmin edici cevap verir
    │
    ▼
Agent: NFT taslağı hazırlar (draft_nft_metadata)
    │  İsim, açıklama, özel yetenek — birlikte belirlenir
    │
    ▼
Agent: AI görsel üretir (generate_nft_image)
    │  Cyberpunk stil, arketipe uygun
    │
    ▼
Agent: Mint tetikler (mint_nft)
    │  Gerçek on-chain ERC-721 veya simüle
    │
    ▼
Agent: XP + rozet ödülü verir (award_xp + unlock_achievement)  ← [YENİ]
    │  "Blockchain Master" rozetini kazandın!
    │
    ▼
NFT cüzdana düşer + Canlı Feed'de görünür + Leaderboard güncellenir
```

Agent ikna olmadıysa ipucu verir ve teşvik eder. Asla 3 denemeden fazla uzatmaz.

### 4.6 Agent Bilgi Bankası

Agent'ın system prompt'unda güncel blockchain bilgileri embedded olarak bulunur:

| Konu | Bilgi |
|------|-------|
| Gas Ücretleri (2026) | ETH transfer ~$0.004, L2 ~$0.0003 |
| ERC Standartları | ERC-20 (USDC, 6 decimal), ERC-721 (NFT, benzersiz token) |
| ERC-8004 | On-chain agent identity — Octan 2026, 20+ zincir |
| EIP-7702 | EOA superpowers, migration-free |
| x402 | HTTP 402 payment protocol |
| Account Abstraction | Smart wallet, Paymaster sponsorluğu, Safe |
| L2 Karşılaştırma | Base (en ucuz), Arbitrum (en iyi DeFi), Optimism (Superchain) |

### 4.7 Yanılgı Düzeltmeleri

Agent, öğrencilerin yaygın yanılgılarını aktif olarak düzeltir:

| Yanılgı | Düzeltme |
|---------|----------|
| "Blockchain bilgi saklar" | "Blockchain sahipliği kanıtlar. Az önce yaptığın transfer bir KAYIT değil, gerçek bir SAHİPLİK transferiydi." |
| "AI ve blockchain aynı şey" | "AI düşünür ve karar verir, blockchain bu kararların kanıtını tutar. İkisi birlikte güçlü." |
| "NFT sadece resim" | "NFT dijital sahiplik belgesi. Resim sadece bir temsil." |

### 4.8 Agent-to-Agent İletişim

Agent'lar birbirleriyle mesajlaşabilir:

- **Keşif:** `discover_agents` ile workshop'taki tüm agent'ları görme
- **Mesaj:** `message_agent` ile selamlama, soru, meydan okuma veya takas teklifi
- **Gelen kutusu:** `check_messages` ile gelen mesajları kontrol etme
- **Intent türleri:** greeting, question, challenge, trade

Bu özellik workshop'a sosyal bir katman ekler — öğrenciler kendi agent'ları üzerinden birbirleriyle etkileşir.

### 4.9 Agent Evrim Sistemi [YENİ]

Workshop boyunca agent, sahibinin aktivitelerine göre güçlenir. Bu dinamik bir karakter gelişimi yaratır:

```
Seviye 1 — Acemi Agent (başlangıç)
    │  İlk cüzdan oluşturuldu
    ▼
Seviye 2 — Aktif Agent (ilk transfer sonrası)
    │  Canlı feed'de isim göründü
    ▼
Seviye 3 — Bilge Agent (quiz tamamlandı)
    │  En az 2 quiz kategorisi geçildi
    ▼
Seviye 4 — Ağ Oyuncusu (sosyal aktivite)
    │  3+ farklı agent ile mesajlaşıldı
    ▼
Seviye 5 — Arena Efsanesi (NFT kazanıldı)
    │  Agent + NFT + quiz + transfer tümü tamamlandı
```

Her seviyede agent'ın:
- Konuşma stili derinleşir (daha kompleks cevaplar, daha az ipucu)
- Avatar görünümü güçlenir (aura efekti, ek ikonlar)
- NFT metadata'sına "Level 5 Arena Legend" gibi nitelikler eklenir
- Leaderboard'da özel rozet görünür

---

## 5. Bilgi Hazinesi [GÜNCELLENDİ — 8 Kategori]

### 5.1 Genel Yapı

Platform 8 kategori altında toplam 32+ soru barındırır. Her kategori bir "skill" olarak tanımlanır ve bağımsız olarak tamamlanabilir.

### 5.2 Kategoriler ve Sorular

#### BLOCKCHAIN 101 — Blockchain Temelleri

| # | Soru | Doğru Cevap | Açıklama |
|---|------|-------------|----------|
| 1 | Blockchain'in en temel özelliği nedir? | Verilerin değiştirilemez olması | Bir blok onaylandıktan sonra içeriği değiştirilemez. Bu "immutability" (değişmezlik) olarak bilinir. |
| 2 | Blockchain neden "zincir" olarak adlandırılır? | Her blok bir önceki bloğun hash'ini içerir | Her blok, kendinden önceki bloğun hash değerini taşır ve bu sayede bloklar birbirine bağlanır. |
| 3 | Merkezi olmayan (decentralized) ne demektir? | Ağdaki birçok bilgisayar verilerin kopyasını tutar | Tek bir sunucu yerine binlerce düğüm (node) aynı veriyi tutar. |
| 4 | Akıllı kontrat (smart contract) nedir? | Blockchain üzerinde çalışan otomatik program | Belirli koşullar sağlandığında otomatik çalışan programlardır. |

#### WALLET & KEYS — Cüzdan ve Anahtarlar

| # | Soru | Doğru Cevap | Açıklama |
|---|------|-------------|----------|
| 1 | Kripto cüzdan gerçekte ne saklar? | Private key (özel anahtar) | Cüzdan coin saklamaz, işlem imzalamak için gereken özel anahtarı saklar. |
| 2 | Public key (açık anahtar) ne işe yarar? | Başkalarının sana kripto göndermesini sağlar | Banka hesap numarası gibi — paylaşılabilir. |
| 3 | Seed phrase'ini kaybedersen ne olur? | Cüzdanına bir daha erişemezsin | Seed phrase tek kurtarma yolu. Kaybolursa fonlara erişim kalıcı olarak kaybolur. |
| 4 | Account Abstraction ne sağlar? | Cüzdanı akıllı kontrat gibi programlanabilir yapar | Gas sponsorluğu, sosyal kurtarma gibi özellikler. Agent Arena'da bu sayede gas ücreti yok. |

#### GAS & FEES — Gas ve İşlem Ücretleri

| # | Soru | Doğru Cevap | Açıklama |
|---|------|-------------|----------|
| 1 | Gas ücreti nedir? | Ağ kullanım bedeli | Ethereum'da her işlem hesaplama gücü harcar. Gas bu gücün maliyetidir. |
| 2 | Gas fiyatı ne zaman artar? | Ağ kalabalık olduğunda | Talep arttıkça gas fiyatı yükselir (EIP-1559 mekanizması). |
| 3 | Layer 2 çözümler neden daha ucuzdur? | İşlemleri toplu olarak ana zincire gönderirler | Yüzlerce işlemi tek bir Ethereum işlemi olarak paketler (rollup). |
| 4 | "Gasless transaction" gerçekten ücretsiz mi? | Hayır, ücreti başka biri öder (Paymaster) | Agent Arena'da gas ücretini platform öder — öğrenci görmez. |

#### TX ANATOMY — İşlem Anatomisi

| # | Soru | Doğru Cevap | Açıklama |
|---|------|-------------|----------|
| 1 | Bir Ethereum işlemi ne içerir? | Gönderen, alıcı, miktar, gas limiti, nonce | Her işlem bu temel bileşenlerden oluşur. |
| 2 | Nonce ne işe yarar? | İşlemlerin sırasını ve tekrarını kontrol eder | Her hesabın artan bir sayacı. Aynı nonce ile iki işlem gönderilemez. |
| 3 | Transaction hash ne için kullanılır? | İşlemi blockchain üzerinde bulmak ve doğrulamak için | Her işlemin benzersiz parmak izi. Etherscan'de arama yapılabilir. |
| 4 | Bir işlem "confirmed" ne demek? | Madenciler/doğrulayıcılar tarafından bir bloğa dahil edildi | İşlem ağ tarafından kabul edildi ve geri döndürülemez hale geldi. |

#### TOKEN & NFT — Token ve NFT

| # | Soru | Doğru Cevap | Açıklama |
|---|------|-------------|----------|
| 1 | ERC-20 ve ERC-721 arasındaki fark nedir? | ERC-20 fungible (değiştirilebilir), ERC-721 non-fungible (benzersiz) | 1 USDC = 1 USDC, ama her NFT benzersizdir. |
| 2 | NFT "non-fungible" ne demek? | Her birinin benzersiz olduğu, birbiriyle değiştirilemeyeceği anlamına gelir | Bir sanat eseri gibi — kopyası olsa bile orijinal tektir. |
| 3 | NFT metadata nerede saklanır? | Genellikle IPFS veya bir sunucuda, blockchain'de sadece referans | On-chain metadata çok pahalı olduğundan, genellikle off-chain saklanır. |
| 4 | "Mint" ne demektir? | Yeni bir token/NFT oluşturmak | Daha önce var olmayan bir dijital varlığı blockchain'e yazmak. |
| 5 | Bir NFT'yi "sahip olmak" ne anlama gelir? | Blockchain kayıtlarının senin adresini göstermesi | Sahiplik fiziksel bir dosya değil, blockchain'deki bir kayıt. |

#### SECURITY 101 — Güvenlik Temelleri

| # | Soru | Doğru Cevap | Açıklama |
|---|------|-------------|----------|
| 1 | Phishing saldırısı nedir? | Sahte site/mesajla özel anahtarınızı çalmaya çalışmak | Gerçek gibi görünen sahte siteler en yaygın tehdit. |
| 2 | Akıllı kontrat onaylarken nelere dikkat etmelisin? | Hangi token'lara ne kadar erişim verdiğine | Sınırsız onay (unlimited approval) tehlikeli olabilir. |
| 3 | "Not your keys, not your coins" ne demek? | Özel anahtarlar sende değilse, coin'ler gerçekten senin değil | Borsa hesabında duran coin'ler borsanın kontrolünde. |

#### AI AGENTS — Yapay Zeka Agent'ları [YENİ KATEGORİ]

| # | Soru | Doğru Cevap | Açıklama |
|---|------|-------------|----------|
| 1 | AI agent nedir? | Hedeflere ulaşmak için kararlar alan ve araçları kullanan otonom bir program | Basit chatbot değil — düşünür, plan yapar, hareket eder. |
| 2 | Blockchain üzerindeki bir AI agent ne avantaj kazanır? | İşlemlerinin değiştirilemez kaydını ve güvenilir kimliğini | Kimin ne zaman ne yaptığı şüpheye yer bırakmadan kanıtlanabilir. |
| 3 | ERC-8004 ne sağlar? | AI agent'lara zincir üzerinde kalıcı kimlik ve cüzdan | Agent'lar artık sahibi olmadan da işlem yapabilir, para tutabilir. |
| 4 | Bir agent "agentic loop"ta nasıl çalışır? | Düşünür → araç kullanır → sonucu değerlendirir → tekrar düşünür | Tek bir soruda birden fazla adım zincirleyerek karmaşık işler yapar. |
| 5 | Agent Arena'da agent neden NFT vermeyi reddedebilir? | Öğrenci blockchain sorularını yeterince yanıtlamadıysa | Agent bir gatekeeper: bilgisiz davranışı ödüllendirmez. |

#### WEB3 ECONOMY — Merkeziyetsiz Ekonomi [YENİ KATEGORİ]

| # | Soru | Doğru Cevap | Açıklama |
|---|------|-------------|----------|
| 1 | DeFi ne demektir? | Decentralized Finance — merkezi aracılar olmadan finansal işlemler | Banka olmadan borç ver, al, takas yap. |
| 2 | Likidite havuzu (liquidity pool) nedir? | Kullanıcıların işlem yapabilmesi için sağlanan token rezervi | AMM'ler bu havuzları kullanarak fiyat hesaplar. |
| 3 | DAO nedir? | Decentralized Autonomous Organization — akıllı kontratla yönetilen topluluk | Kararlar oy hakkı olan token sahipleri tarafından alınır. |
| 4 | "Tokenomics" ne anlama gelir? | Token arzı, dağılımı ve teşvik yapısını kapsayan ekonomik model | İyi tokenomics değer yaratır, kötü tokenomics çöküşü hızlandırır. |

### 5.3 Puanlama ve İlerleme [GÜNCELLENDİ]

- Her doğru cevap: soru sayısına göre oransal puan
- Her skill tamamlamada: **100 XP** (leaderboard'a yansır)
- İlerleme artık **Supabase `quiz_progress` tablosunda** saklanır ~~(localStorage'dan taşındı)~~
- Tamamlanan skill'ler yeşil check ile işaretlenir
- Yeniden deneme her zaman mümkün
- **[YENİ]** Tüm 8 kategoriyi tamamlayan öğrenci "Omniscient" rozetini kazanır

### 5.4 Quiz UX

- Multiple choice ve true/false formatları
- Her sorunun 4 seçeneği var
- Yanlış cevap sonrası açıklama gösterilir
- Sonuç ekranı: yüzde skoru + tekrar dene / devam et butonları
- Cyberpunk temalı kart tasarımı
- **[YENİ]** Her doğru cevap sonrası micro-animation (XP ödülü uçuyor)

---

## 6. NFT Sistemi

### 6.1 NFT Nasıl Kazanılır?

NFT kazanmak için öğrencinin agent'ı ikna etmesi gerekir. Süreç:

1. Agent ile sohbette NFT konusu açılır
2. Agent quiz soruları sorar (blockchain bilgisi testi)
3. En az 2 soruya tatmin edici cevap verilir
4. Agent NFT taslağı hazırlar — isim, açıklama ve özel yetenek birlikte belirlenir
5. AI görsel üretir (cyberpunk stil, arketipe uygun)
6. Agent mint'i tetikler
7. NFT cüzdana düşer
8. **[YENİ]** Agent seviyesi ve kazanılan rozetler NFT attribute'larına işlenir

### 6.2 NFT Metadata Yapısı [GÜNCELLENDİ]

Her NFT şu bilgileri taşır:

```json
{
  "name": "Neon Katana",
  "description": "Blockchain'in gücünü keşfeden bir dijital savaşçı",
  "image": "https://storage.supabase.co/nft-images/...",
  "workshop_name": "Agent Arena Workshop",
  "arena_name": "kivanc.arena",
  "archetype": "hacker",
  "agent_name": "CyberBlade",
  "achievement": "Blockchain Master",
  "special_trait": "Hash Kırıcı",
  "agent_level": 4,
  "xp_at_mint": 350,
  "badges_earned": ["First Transfer", "Quiz Champion", "Social Butterfly"],
  "workshop_city": "Mersin",
  "extra_attributes": { ... }
}
```

### 6.3 Görsel Üretimi

- Agent `generate_nft_image` tool'unu çağırır
- Prompt İngilizce + cyberpunk/dijital sanat stili
- Arketipe göre farklı görsel temaları:
  - Hacker → kod akışları, yeşil matris
  - Sage → kitaplar, mor aura
  - Korsan → hazine sandığı, dijital harita
  - Scientist → laboratuvar, test tüpleri
  - Glitch → bozuk ekran, pixel art
  - **Oracle** → kristal veri akışı, gözler, gelecek haritası [YENİ]
  - **Phantom** → karanlık siluet, şifreli desenler, kriptografik aura [YENİ]
- Supabase Storage'a yüklenir (nft-images bucket)
- Üretim başarısız olursa fallback SVG ikonları kullanılır

### 6.4 Mint Mekanizması

İki mod desteklenir:

| Mod | Koşul | Davranış |
|-----|-------|----------|
| **Gerçek Mint** | Contract + private key tanımlı | On-chain ERC-721 mintTo() çağrısı |
| **Simüle Mint** | Contract yoksa | Fake tx hash + artan tokenId, metadata kaydı |

Her iki modda da `nft_metadata` tablosuna kayıt oluşturulur. Adres başına **1 NFT** sınırı vardır (duplicate kontrolü).

---

## 7. Canlı Sınıf Feed [GÜNCELLENDİ]

### 7.1 Nasıl Çalışır? [GÜNCELLENDİ]

- **Mevcut:** Frontend her 3 saniyede `/api/activity` endpoint'ini poll eder
- **Önerilen:** Supabase Realtime Channels ile WebSocket tabanlı gerçek anlık güncelleme
  - `supabase.channel('activity').on('INSERT', callback).subscribe()`
  - Sunucu yükü azalır, gecikme sıfıra düşer, 30+ kişilik sınıflarda scale eder
- Son 20 event gösterilir, yeniden eskiye
- Terminal tarzı cyberpunk görünüm

### 7.2 Event Türleri [GÜNCELLENDİ]

| Tür | Mesaj Örneği |
|-----|-------------|
| `wallet_created` | "kivanc.arena cüzdanını oluşturdu" |
| `transfer` | "kivanc.arena → tarik.arena'ya 0.001 ETH gönderdi" |
| `nft_mint` | "kivanc.arena NFT mint etti! 🔥" |
| `faucet` | "kivanc.arena faucet'ten 0.005 ETH aldı" |
| `transfer_request` | "kivanc.arena, tarik.arena'dan 0.002 ETH talep etti" |
| `agent_registered` | "CyberBlade (hacker) arena'ya katıldı" |
| `agent_message` | "CyberBlade → DataPirate'a mesaj gönderdi" |
| `quiz_completed` | **[YENİ]** "kivanc.arena 'Security 101' quiz'ini tamamladı! +100 XP" |
| `achievement_unlocked` | **[YENİ]** "kivanc.arena 'First NFT' rozetini kazandı! 🏆" |
| `leaderboard_update` | **[YENİ]** "kivanc.arena liderlik tablosunda 1. sıraya çıktı!" |
| `agent_level_up` | **[YENİ]** "CyberBlade Level 3'e ulaştı — Bilge Agent!" |

### 7.3 Pedagojik Etki

- **Şeffaflık:** Blockchain'in "herkes görebilir" özelliğinin canlı kanıtı
- **Sosyal kanıt:** "Arkadaşım yaptıysa ben de yapabilirim" etkisi
- **Rekabet:** Kim daha çok transfer yaptı, kim NFT kazandı
- **Eğitmen ekranı:** Projeksiyon üzerinde büyük ekranda gösterilebilir
- **[YENİ] FOMO efekti:** "kivanc.arena Level 4'e geçti!" mesajı diğer öğrencileri harekete geçirir

---

## 8. Transfer ve Talep Sistemi

### 8.1 Token Transfer

- `.arena` isim veya `0x` adres ile alıcı seçme
- Gerçek zamanlı isim çözümleme (400ms debounce, yeşil tik/kırmızı çarpı)
- Varsayılan miktar: 0.001 ETH
- Gasless işlem (Paymaster sponsorluğu)
- Başarılı transfer → canlı feed'e otomatik post
- Etherscan linki ile doğrulama imkanı

### 8.2 Transfer Talepleri

Öğrenciler birbirinden ETH talep edebilir:

- Agent `request_transfer` tool'u ile veya UI üzerinden
- Talep gönderenin adı, miktar ve neden görünür
- Alıcı kabul/ret butonu ile yanıtlar
- Durumlar: `pending` → `accepted` / `rejected`
- Kabul edilen talepler canlı feed'de gösterilir

---

## 9. Agent Ağı (Agent Discovery)

### 9.1 Keşif Ekranı

- Workshop'taki tüm kayıtlı agent'lar listelenir
- Her agent kartında: isim, arketip, sahip adı, son görülme zamanı, **agent seviyesi** [YENİ]
- 5 saniyede bir otomatik güncelleme
- Arketipe göre renk kodlaması

### 9.2 P2P Agent Mesajlaşma

Öğrenciler kendi agent'ları üzerinden başka agent'lara mesaj gönderebilir:

- Selamlama, soru, meydan okuma veya takas teklifi
- Mesajlar agent'ın gelen kutusunda görünür
- Agent sonraki sohbette bu mesajları bağlam olarak kullanır
- **[YENİ] Meydan Okuma Mekaniği:** Bir agent başka bir agent'a quiz challenge gönderebilir. Kazanan +50 XP alır.

---

## 10. Profil Sayfası [GÜNCELLENDİ]

### 10.1 İçerik

- **NFT Galerisi:** Mint edilen tüm NFT'ler kartlar halinde
  - Görsel, isim, açıklama, arketip, agent adı, özel yetenek
  - Arketipe göre renkli çerçeve
- **İstatistikler:**
  - Toplam işlem sayısı
  - Transfer sayısı
  - NFT sayısı
  - **[YENİ]** Toplam XP
  - **[YENİ]** Leaderboard sıralaması
  - **[YENİ]** Agent seviyesi
- **[YENİ] Rozet Vitrini:** Kazanılan tüm achievement'lar görsel olarak sergilenir
- **İşlem Geçmişi:** Kullanıcının adresine ait tüm aktiviteler

### 10.2 Workshop Sonrası Değer

Profil sayfası workshop bittikten sonra da erişilebilir kalır. Öğrenci:
- NFT'sini ailesiyle paylaşabilir
- Etherscan'de işlemlerini gösterebilir
- Workshop deneyiminin kalıcı bir kanıtına sahip olur
- **[YENİ]** Rozetlerini sosyal medyada paylaşabilir (og:image desteği)

---

## 11. Workshop Akışı [GÜNCELLENDİ — 2.5 Saat]

```
Zaman    Aktivite                                Süre    Modül
──────── ────────────────────────────────────── ──────── ────────────
0:00     Giriş + canlı feed tanıtımı             5 dk    Sunum
0:05     Session kodu + cüzdan + isim kayıt     15 dk    Onboarding
0:20     Test ETH alma (faucet)                  5 dk    Cüzdan
0:25     İlk transfer + feed'de izleme          15 dk    Cüzdan + Feed
0:40     Agent oluşturma + tanışma              15 dk    Agent Chat
0:55     Agent'ı ikna et — NFT kazanma          20 dk    Agent Chat
1:15     MOLA + leaderboard istatistikleri       5 dk    Feed + LB
1:20     Bilgi Hazinesi quiz'leri               15 dk    Challenge
1:35     Agent Ağı keşfi + meydan okuma         15 dk    Agent Ağı
1:50     Serbest keşif + XP yarışı              20 dk    Tüm modüller
2:10     Profil + rozet + sıralama inceleme     10 dk    Profil + LB
2:20     Özet + soru-cevap + ödül töreni        10 dk    Sunum + Feed
```

**Her aktivite max 15 dakika** — dikkat süresi verisine (ortalama 6dk quiz süresi) göre optimize.

> 💡 **Eğitmen Notu:** Serbest keşif ve XP yarışı bölümü (1:50-2:10) kasıtlı olarak 20 dakikaya uzatılmıştır. Bu segment en yüksek organik etkileşimi üretmektedir — öğrenciler birbirini leaderboard'dan geçmeye çalışırken kendiliğinden öğrenirler.

---

## 12. Güvenlik ve Limitler [GÜNCELLENDİ]

### 12.1 Rate Limiting

| Kaynak | Limit | Takip |
|--------|-------|-------|
| Chat mesajları | 30 / session | Supabase + in-memory fallback |
| Faucet talepleri | 3 / adres | Supabase rate_limits tablosu |
| NFT mint | 1 / adres | Supabase nft_mints unique index |
| **[YENİ]** Achievement kilidi | 1 / tip / adres | Supabase user_achievements unique |
| **[YENİ]** Agent meydan okuma | 5 / saat | Rate limiting tablosu |

### 12.2 API Güvenliği

- `ANTHROPIC_API_KEY` — sadece Edge Functions'da
- `THIRDWEB_SECRET_KEY` — sadece Edge Functions'da
- `FUJI_PRIVATE_KEY` / `SEPOLIA_PRIVATE_KEY` — sadece Edge Functions'da
- `SUPABASE_SERVICE_KEY` — sadece Edge Functions'da
- Frontend'te sadece public key'ler: `VITE_THIRDWEB_CLIENT_ID`, `VITE_SUPABASE_ANON_KEY`
- Supabase RLS politikaları tüm tablolarda aktif
- **[YENİ]** Instructor endpoint'leri session token ile korunur

### 12.3 İçerik Güvenliği

- Agent gerçek para veya yatırım tavsiyesi vermez
- Mainnet işlemleri hakkında yönlendirme yapmaz
- Her şeyin testnet üzerinde olduğu hatırlatılır
- Yanıtlar max 3-4 cümle (token limiti: **500**) ← *300'den 500'e çıkartıldı: Level 4-5 agent'lar için daha derin yanıt*

---

## 13. Gamification & XP Sistemi [YENİ BÖLÜM]

### 13.1 XP Kazanma Yolları

| Aktivite | XP |
|----------|----|
| Cüzdan oluşturma | +10 |
| İsim kaydetme | +10 |
| İlk faucet | +20 |
| İlk transfer gönderme | +30 |
| İlk transfer alma | +15 |
| Quiz kategorisi tamamlama | +100 |
| Tek quiz sorusu doğru cevaplama | +10 |
| NFT kazanma | +200 |
| Agent oluşturma | +25 |
| Agent'a mesaj gönderme | +10 |
| Meydan okuma kazanma | +50 |
| Farklı 5 kişiye transfer | +75 (bonus) |
| Tüm arketiplerle mesajlaşma | +100 (bonus) |

### 13.2 Rozet Sistemi

| Rozet | Koşul | Görsel |
|-------|-------|--------|
| 🚀 **Genesis** | İlk cüzdan oluşturuldu | Roket |
| 💸 **First Move** | İlk transfer gönderildi | Kripto para |
| 🧠 **Quiz Starter** | İlk quiz tamamlandı | Beyin |
| 🏆 **NFT Owner** | İlk NFT kazanıldı | Kupa |
| 🤖 **Agent Creator** | İlk agent oluşturuldu | Robot |
| 🌐 **Social Butterfly** | 5+ farklı agent ile mesajlaşıldı | Ağ |
| 📚 **Knowledge Seeker** | 4+ quiz kategorisi tamamlandı | Kitap |
| 🔮 **Omniscient** | Tüm 8 kategori tamamlandı | Kristal küre |
| ⚡ **Speed Runner** | 45 dakikada NFT kazanıldı | Şimşek |
| 👑 **Arena Legend** | Agent Level 5'e ulaştı | Taç |
| 🤝 **Deal Maker** | 3+ transfer talebi kabul edildi | El sıkışma |
| 🎯 **Challenger** | 3 meydan okuma kazanıldı | Hedef |

### 13.3 Leaderboard

- Gerçek zamanlı XP sıralaması
- Top 3 için özel renk kodu (altın / gümüş / bronz)
- Son 1 saatteki XP artışı gösterimi ("Bu saat +250 XP")
- Workshop sonunda ekrana yansıtılmak için büyük ekran modu
- Eğitmen sonunda top 3'e sembolik ödül verebilir

---

## 14. Eğitmen Dashboard [YENİ BÖLÜM]

### 14.1 Session Yönetimi

Eğitmen workshop'tan önce şunları yapar:

1. **Session oluştur:** Benzersiz kod (`ARENA-2026-MERSIN-A`), süre, şehir bilgisi
2. **Katılım limiti belirle:** Kaç öğrenci max katılabilir
3. **Başlangıç zamanı ayarla:** Onboarding briefing slaytları eşzamanlı başlar
4. **Toplu faucet:** Tüm bağlı öğrencilere tek tuşla ETH gönder

### 14.2 Gerçek Zamanlı İzleme

Eğitmen panosu şunları gösterir:

| Panel | İçerik |
|-------|--------|
| **Katılım Haritası** | Kim bağlı, kim hangi adımda |
| **İlerleme Özeti** | Kaçı NFT kazandı, kaçı quiz tamamladı |
| **Canlı Feed** | Büyük ekrana yansıtmak için özel mod |
| **Leaderboard** | Anlık sıralama, ödül töreni için |
| **Sorunlu Öğrenciler** | 10 dk'dan uzun süre aynı adımda kalan öğrenciler (yardım gerekebilir) |

### 14.3 Eğitmen Komutları

```
POST /api/instructor
{
  "action": "broadcast",       // Feed'e özel mesaj gönder
  "action": "freeze",          // Tüm sınıfı bir sonraki adımda beklet
  "action": "unfreeze",        // Devam et
  "action": "airdrop",         // Seçili öğrencilere ETH gönder
  "action": "reset_quiz",      // Bir öğrencinin quiz ilerlemesini sıfırla
  "action": "end_session"      // Workshop'u kapat, final feed göster
}
```

### 14.4 Post-Workshop Raporu

Workshop sonunda eğitmene otomatik e-posta ile şu rapor gönderilir:

- Toplam katılımcı sayısı
- Ortalama tamamlanma oranı (modül bazında)
- Kaçı NFT kazandı
- Quiz başarı oranları (kategori bazında)
- Top 10 leaderboard
- En aktif agent arketipleri

---

## 15. Sayısal Özet [GÜNCELLENDİ]

| Metrik | v0.1 | v2.0 |
|--------|------|------|
| React component | 10 | 14+ |
| Edge Function (API endpoint) | 12 | 15 |
| Agent tool | 17 | 19 |
| Agent arketip | 5 | 7 |
| Quiz kategorisi | 6 | 8 |
| Quiz sorusu | 20+ | 32+ |
| Veritabanı tablosu | 13 | 16 |
| Onboarding adımı | 6 (0-5) | 7 (0-6) |
| Briefing slaytı | 6 | 8 |
| XP / skill | 100 | 100 |
| Rozet sayısı | — | 12 |
| Faucet miktarı | 0.005 ETH | 0.005 ETH |
| Varsayılan transfer | 0.001 ETH | 0.001 ETH |
| Chat rate limit | 30 mesaj/session | 30 mesaj/session |
| Faucet rate limit | 3 talep/adres | 3 talep/adres |
| NFT limit | 1/adres | 1/adres |
| Feed güncelleme | 3sn polling | WebSocket (önerilir) |
| Agent agentic loop | max 5 tur | max 7 tur |
| Max token/yanıt | 300 | 500 |
| Agent seviyeleri | — | 5 |

---

## 16. Gelecek Sürümler [GÜNCELLENDİ]

### v0.2 — Eskişehir Workshop *(öncelikli)*
- ✅ Eğitmen dashboard (session oluştur, izle, toplu ETH) — *bu belgede tasarlandı*
- ✅ Achievement badge sistemi — *bu belgede tasarlandı*
- ✅ Leaderboard — *bu belgede tasarlandı*
- ✅ Agent Evrim Sistemi (Level 1-5) — *bu belgede tasarlandı*
- ✅ Oracle + Phantom arketipleri — *bu belgede tasarlandı*
- ✅ 2 yeni quiz kategorisi (AI Agents + Web3 Economy) — *bu belgede tasarlandı*
- ⬜ Dynamic NFT (sohbet kalitesine göre metadata değişimi)
- ⬜ Peer-to-peer hazine avı mekaniği
- ⬜ WebSocket geçişi (Supabase Realtime Channels)
- ⬜ Quiz progress Supabase'e taşıma (localStorage kaldırma)

### v0.3 — Olgunlaşma
- ERC-8004 agent identity (on-chain kimlik)
- Multi-agent orkestrasyon
- Agent-to-agent ticaret ve müzakere
- Reputation sistemi (on-chain veya off-chain hibrit)
- On-chain credential (SBT — Soulbound Token)
- **[YENİ]** Cross-workshop leaderboard (Mersin + Eskişehir toplam sıralama)
- **[YENİ]** AI difficulty scaling: agent öğrencinin seviyesine göre quiz zorluğunu adapte eder

### v1.0 — Tam Platform
- Visual agent builder (drag & drop)
- Agent yaşam döngüsü yönetimi
- Cross-workshop agent taşınabilirliği
- Analytics dashboard (öğrenme kazanımları ölçümü)
- Mainnet deployment seçeneği
- **[YENİ]** Okul entegrasyonu API (not sistemi ile bağlantı)
- **[YENİ]** Çoklu eğitmen desteği (asistan moderatörler)
- **[YENİ]** White-label modu (farklı kurumlar kendi markalarıyla kullanabilir)

---

## Ek A: Teknik Borç ve Önerilen Düzeltmeler [YENİ]

| Sorun | Risk | Önerilen Çözüm | Öncelik |
|-------|------|----------------|---------|
| Quiz progress localStorage'da | Tarayıcı temizlenince sıfırlanıyor | Supabase `quiz_progress` tablosu | 🔴 Yüksek |
| Feed 3sn polling | 30+ öğrencide sunucu yükü | Supabase WebSocket Channels | 🟡 Orta |
| Agent loop max 5 tur | Karmaşık NFT süreçleri tamamlanamıyor | 7 tura çıkar | 🟡 Orta |
| Max token 300 | Level 4-5 agent yanıtları kesilebiliyor | 500'e çıkar | 🟡 Orta |
| `arena_names` tablosu çift kayıtlı | Schema tutarsızlığı | Tekrar eden satırı kaldır | 🟢 Düşük |

---

*Bu döküman Agent Arena v0.1.0 (Mersin Workshop Release) üzerinden kapsamlı analiz ve v2.0 geliştirme önerileriyle yeniden yazılmıştır.*
*Son güncelleme: Mart 2026 — Koza DAO + Team1*
