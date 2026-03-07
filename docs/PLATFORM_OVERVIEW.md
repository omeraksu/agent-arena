# Agent Arena — Platform Dokümantasyonu

> Blockchain workshop'larında katılımcılara uygulamalı deneyim sunan eğitim platformu.
> Koza DAO + Team1 tarafından geliştirilmektedir.

---

## 1. Platform Nedir?

Agent Arena, öğrencilerin bir AI agent ile sohbet ederek blockchain kavramlarını **deneyimleyerek** öğrendiği bir workshop platformudur. Katılımcılar:

- Tarayıcıdan tek tıkla cüzdan oluşturur (MetaMask yok, seed phrase yok)
- Arkadaşlarına token transfer eder (gas ücreti yok)
- Bir AI agent'ı blockchain bilgisiyle ikna ederek NFT kazanır
- Tüm bunları yaparken sınıfça canlı feed'den birbirlerini izler

Platform "buton tıkla → mint" yaklaşımı yerine **"agent'ı ikna et → kazan"** mekaniğiyle çalışır. Bu sayede öğrenme pasif değil, aktif ve sosyal bir deneyime dönüşür.

**Hedef Kitle:** 11-17 yaş (5. sınıftan 11. sınıfa), lab bilgisayarlarından tarayıcı üzerinden erişim.

---

## 2. Teknik Altyapı

### 2.1 Mimari

```
Kullanıcı (Tarayıcı)
    │
    ├── React SPA (Vite + TypeScript + Tailwind)
    │       │
    │       ├── thirdweb In-App Wallet + Account Abstraction
    │       │       └── Gasless transaction (Paymaster sponsorluğu)
    │       │
    │       ├── Supabase Realtime (canlı feed)
    │       │
    │       └── Vercel Edge Functions (12 endpoint)
    │               ├── Claude Sonnet 4 API (agent chat)
    │               ├── Faucet (test ETH dağıtımı)
    │               ├── Mint (NFT basımı)
    │               └── Activity, Names, Requests...
    │
    └── Ethereum Sepolia Testnet
            └── WorkshopNFT (ERC-721 kontrat)
```

### 2.2 Tech Stack

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Frontend | React + Vite + TypeScript | Hızlı geliştirme, lab tarayıcılarında sorunsuz |
| Stil | Tailwind CSS | Cyberpunk temalı, hızlı prototipleme |
| Cüzdan | thirdweb In-App Wallet + Account Abstraction | Email/Google login, gasless tx, ücretsiz tier |
| Blockchain | Ethereum Sepolia Testnet | Hızlı, ücretsiz, explorer desteği |
| AI | Anthropic Claude Sonnet 4 | Tool use destekli agent chat |
| Backend | Vercel Edge Functions (12 adet) | API proxy, rate limiting, mint tetikleme |
| Veritabanı | Supabase (PostgreSQL) + in-memory fallback | Realtime feed, chat geçmişi, rate limit |
| Deploy | Vercel (tek komut) | Frontend + Edge Functions tek yerde |

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

### 2.4 Veritabanı Şeması (13 tablo)

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
| `arena_names` | Adres ↔ kullanıcı adı eşleştirmesi |
| Storage (bucket) | `nft-images` — AI üretimi NFT görselleri |

Tüm tablolarda Row Level Security (RLS) politikaları aktif.

### 2.5 API Endpoints (12 Edge Function)

| Endpoint | Metod | İşlev |
|----------|-------|-------|
| `/api/chat` | POST | Claude API proxy — streaming SSE, rate limited |
| `/api/agent` | POST | Gelişmiş agent — 17 tool ile agentic loop (max 5 tur) |
| `/api/faucet` | POST | Test ETH dağıtımı (0.005 ETH, adres başına max 3) |
| `/api/mint` | POST | NFT mint tetikleme (gerçek on-chain veya simüle) |
| `/api/activity` | GET/POST | Canlı feed event'leri (son 20, 3sn polling) |
| `/api/names` | GET/POST | Arena isim kaydı ve çözümleme |
| `/api/agents` | GET/POST | Agent registry ve agent-to-agent mesajlaşma |
| `/api/requests` | GET/POST/PATCH | P2P transfer talepleri |
| `/api/nfts` | GET | Kullanıcının NFT koleksiyonu |
| `/api/metadata/[tokenId]` | GET | NFT metadata JSON (ERC-721 uyumlu) |
| `/api/generate-image` | POST | AI görsel üretimi (NFT için) |
| `/api/chat-history` | GET/POST | Sohbet geçmişi persistansı |

### 2.6 Gasless Transaction Mekanizması

Öğrenciler hiçbir zaman gas ücreti görmez:

1. Kullanıcı email/Google ile giriş yapar
2. thirdweb otomatik olarak bir **Smart Wallet** (Account Abstraction) oluşturur
3. Tüm işlemler Paymaster tarafından sponsor edilir
4. Transfer, mint, faucet — hepsi gas-free

Bu sayede "cüzdan kur, ETH al, gas öde" sürtünmesi tamamen ortadan kalkar.

---

## 3. Kullanıcı Deneyimi

### 3.1 Onboarding Akışı (5 Adım)

Platform, kullanıcıyı adım adım yönlendiren bir onboarding sistemiyle çalışır. Her adım bir öncekini tamamlamadan açılmaz.

#### Adım 0 — Briefing (6 Slayt)

Kullanıcı ilk girişte 6 slaytlık bir tanıtım görür. Her slayt bir blockchain kavramını kısa ve etkileyici şekilde anlatır:

| # | Başlık | İçerik |
|---|--------|--------|
| 1 | Digital Sovereignty | "Dijital kimliğin senin elinde" |
| 2 | World Computer | "Binlerce bilgisayar aynı anda çalışıyor" |
| 3 | AI Fuel | "AI agent'lar blockchain üzerinde hareket ediyor" |
| 4 | NFT DNA | "Her NFT benzersiz bir dijital varlık" |
| 5 | Don't Trust, Verify | "Güvenme, doğrula" |
| 6 | Borderless Economy | "Sınırsız ekonomi" |

Her slayt ASCII art ve istatistiklerle desteklenir. Cyberpunk temasına uygun görsel dil.

#### Adım 1 — Giriş ve Cüzdan Oluşturma

- Email veya Google login (thirdweb In-App Wallet)
- Otomatik smart wallet oluşturma
- Cüzdan adresi görüntüleme
- Süre: ~30 saniye

#### Adım 2 — Arena İsmi Kaydetme

- 3-16 karakter, alfanümerik + alt çizgi
- `.arena` uzantılı ENS benzeri isimlendirme (örn: `kivanc.arena`)
- İsim önerici: Rastgele isim üreteci (crypto_wolf, neon_sage gibi)
- Benzersizlik kontrolü (aynı isim iki kez alınamaz)
- Transfer formlarında isim çözümleme: `kivanc.arena` yazınca adres otomatik gelir

#### Adım 3 — Test ETH Alma (Faucet)

- Tek butonla 0.005 ETH talep etme
- Adres başına max 3 talep
- Backend cüzdanından otomatik transfer
- Bakiye anlık güncelleme

#### Adım 4 — İlk Transfer

- Arkadaşına 0.001 ETH gönderme
- `.arena` isim veya `0x` adres ile alıcı seçme
- Gerçek zamanlı isim çözümleme (400ms debounce)
- Gasless işlem — gas ücreti yok
- Etherscan linki ile doğrulama

#### Adım 5 — Tamamlandı

- Tebrik ekranı
- Hub'a yönlendirme
- Tüm modüller açılır

### 3.2 Ana Sayfa (Hub)

Onboarding sonrası kullanıcı 5 modül kartından oluşan hub'a gelir:

| Modül | Açıklama | İkon |
|-------|----------|------|
| **Cüzdan** | Bakiye, transfer, faucet, işlem geçmişi | Dijital kimlik |
| **Agent Chat** | AI agent ile sohbet, NFT kazanma | AI etkileşim |
| **Bilgi Hazinesi** | 6 kategoride blockchain quiz'leri | Challenge |
| **Agent Ağı** | Workshop'taki tüm agent'ları keşfet | Keşif |
| **Profil** | NFT koleksiyonu, istatistikler | Kişisel alan |

Her kart cyberpunk temalı, hover efektli, kilitli modüller için kilit ikonu gösterilir.

---

## 4. AI Agent Sistemi

### 4.1 Agent Oluşturma

Kullanıcı ilk chat'e başladığında bir agent oluşturur:

1. **Arketip Seçimi** — 5 kişilikten birini seç
2. **Kişilik Ayarları** — 3 slider ile ince ayar
3. **İsim** — Agent'a özel bir isim ver
4. **Kayıt** — Agent registry'ye kaydedilir, diğer kullanıcılar görebilir

### 4.2 Agent Arketipleri

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

### 4.3 Kişilik Slider'ları

Her arketip 3 slider ile ince ayarlanır:

| Slider | 0 | 50 | 100 |
|--------|---|-----|-----|
| **Teknik** | Sade dil, metafor yok | Dengeli | Kod örnekleri, teknik terimler |
| **Ton** | Resmi, mesafeli | Samimi | Enerjik, meydan okuyan |
| **Detay** | 1-2 cümle | 3-4 cümle | 5+ cümle, derinlemesine |

### 4.4 Agent Yetenekleri (17 Tool)

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

Agent bir **agentic loop** içinde çalışır: Claude düşünür → tool çağırır → sonucu alır → tekrar düşünür → cevap verir. Tek bir mesajda birden fazla tool zincirlenebilir (quiz → metadata → görsel → mint).

### 4.5 Pazarlıkçı Ajan Mekaniği

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
NFT cüzdana düşer + Canlı Feed'de görünür
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

---

## 5. Bilgi Hazinesi (Challenge Quizleri)

### 5.1 Genel Yapı

Platform 6 kategori altında toplam 20+ soru barındırır. Her kategori bir "skill" olarak tanımlanır ve bağımsız olarak tamamlanabilir.

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

### 5.3 Puanlama ve İlerleme

- Her doğru cevap: soru sayısına göre oransal puan
- Her skill tamamlamada: **100 XP**
- İlerleme `localStorage`'da saklanır (`arena_skills_progress` anahtarı)
- Tamamlanan skill'ler yeşil check ile işaretlenir
- Yeniden deneme her zaman mümkün

### 5.4 Quiz UX

- Multiple choice ve true/false formatları
- Her sorunun 4 seçeneği var
- Yanlış cevap sonrası açıklama gösterilir
- Sonuç ekranı: yüzde skoru + tekrar dene / devam et butonları
- Cyberpunk temalı kart tasarımı

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

### 6.2 NFT Metadata Yapısı

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

## 7. Canlı Sınıf Feed

### 7.1 Nasıl Çalışır?

- Frontend her 3 saniyede `/api/activity` endpoint'ini poll eder
- Son 20 event gösterilir, yeniden eskiye
- Terminal tarzı cyberpunk görünüm

### 7.2 Event Türleri

| Tür | Mesaj Örneği |
|-----|-------------|
| `wallet_created` | "kivanc.arena cüzdanını oluşturdu" |
| `transfer` | "kivanc.arena → tarik.arena'ya 0.001 ETH gönderdi" |
| `nft_mint` | "kivanc.arena NFT mint etti!" |
| `faucet` | "kivanc.arena faucet'ten 0.005 ETH aldı" |
| `transfer_request` | "kivanc.arena, tarik.arena'dan 0.002 ETH talep etti" |
| `agent_registered` | "CyberBlade (hacker) arena'ya katıldı" |
| `agent_message` | "CyberBlade → DataPirate'a mesaj gönderdi" |

### 7.3 Pedagojik Etki

- **Şeffaflık:** Blockchain'in "herkes görebilir" özelliğinin canlı kanıtı
- **Sosyal kanıt:** "Arkadaşım yaptıysa ben de yapabilirim" etkisi
- **Rekabet:** Kim daha çok transfer yaptı, kim NFT kazandı
- **Eğitmen ekranı:** Projeksiyon üzerinde büyük ekranda gösterilebilir

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
- Her agent kartında: isim, arketip, sahip adı, son görülme zamanı
- 5 saniyede bir otomatik güncelleme
- Arketipe göre renk kodlaması

### 9.2 P2P Agent Mesajlaşma

Öğrenciler kendi agent'ları üzerinden başka agent'lara mesaj gönderebilir:

- Selamlama, soru, meydan okuma veya takas teklifi
- Mesajlar agent'ın gelen kutusunda görünür
- Agent sonraki sohbette bu mesajları bağlam olarak kullanır

---

## 10. Profil Sayfası

### 10.1 İçerik

- **NFT Galerisi:** Mint edilen tüm NFT'ler kartlar halinde
  - Görsel, isim, açıklama, arketip, agent adı, özel yetenek
  - Arketipe göre renkli çerçeve
- **İstatistikler:**
  - Toplam işlem sayısı
  - Transfer sayısı
  - NFT sayısı
- **İşlem Geçmişi:** Kullanıcının adresine ait tüm aktiviteler

### 10.2 Workshop Sonrası Değer

Profil sayfası workshop bittikten sonra da erişilebilir kalır. Öğrenci:
- NFT'sini ailesiyle paylaşabilir
- Etherscan'de işlemlerini gösterebilir
- Workshop deneyiminin kalıcı bir kanıtına sahip olur

---

## 11. Workshop Akışı (Önerilen 2-3 Saat)

```
Zaman    Aktivite                          Süre    Modül
──────── ──────────────────────────────── ──────── ────────────
0:00     Giriş + canlı feed tanıtımı       5 dk    Sunum
0:05     Cüzdan oluşturma + isim kayıt    10 dk    Cüzdan
0:15     Test ETH alma (faucet)             5 dk    Cüzdan
0:20     İlk transfer + feed'de izleme    15 dk    Cüzdan + Feed
0:35     Agent oluşturma + tanışma        15 dk    Agent Chat
0:50     Agent'ı ikna et — NFT kazanma    20 dk    Agent Chat
1:10     MOLA + feed istatistikleri         5 dk    Feed
1:15     Bilgi Hazinesi quiz'leri          15 dk    Challenge
1:30     Agent Ağı keşfi + mesajlaşma     15 dk    Agent Ağı
1:45     Serbest keşif + yarış            15 dk    Tüm modüller
2:00     Profil inceleme + paylaşım       10 dk    Profil
2:10     Özet + soru-cevap                10 dk    Sunum + Feed
```

**Her aktivite max 15 dakika** — dikkat süresi verisine (ortalama 6dk quiz süresi) göre optimize.

---

## 12. Güvenlik ve Limitler

### 12.1 Rate Limiting

| Kaynak | Limit | Takip |
|--------|-------|-------|
| Chat mesajları | 30 / session | Supabase + in-memory fallback |
| Faucet talepleri | 3 / adres | Supabase rate_limits tablosu |
| NFT mint | 1 / adres | Supabase nft_mints unique index |

### 12.2 API Güvenliği

- `ANTHROPIC_API_KEY` — sadece Edge Functions'da
- `THIRDWEB_SECRET_KEY` — sadece Edge Functions'da
- `FUJI_PRIVATE_KEY` / `SEPOLIA_PRIVATE_KEY` — sadece Edge Functions'da
- `SUPABASE_SERVICE_KEY` — sadece Edge Functions'da
- Frontend'te sadece public key'ler: `VITE_THIRDWEB_CLIENT_ID`, `VITE_SUPABASE_ANON_KEY`
- Supabase RLS politikaları tüm tablolarda aktif

### 12.3 İçerik Güvenliği

- Agent gerçek para veya yatırım tavsiyesi vermez
- Mainnet işlemleri hakkında yönlendirme yapmaz
- Her şeyin testnet üzerinde olduğu hatırlatılır
- Yanıtlar max 3-4 cümle (token limiti: 300)

---

## 13. Sayısal Özet

| Metrik | Değer |
|--------|-------|
| React component | 10 |
| Edge Function (API endpoint) | 12 |
| Agent tool | 17 |
| Agent arketip | 5 |
| Quiz kategorisi | 6 |
| Quiz sorusu | 20+ |
| Veritabanı tablosu | 13 |
| Onboarding adımı | 6 (0-5) |
| Briefing slaytı | 6 |
| XP / skill | 100 |
| Faucet miktarı | 0.005 ETH |
| Varsayılan transfer | 0.001 ETH |
| Chat rate limit | 30 mesaj/session |
| Faucet rate limit | 3 talep/adres |
| NFT limit | 1/adres |
| Feed poll aralığı | 3 saniye |
| Agent agentic loop | max 5 tur |
| Max token/yanıt | 300 |

---

## 14. Gelecek Sürümler

### v0.2 — Eskişehir Workshop
- Agent builder: arketip seçimi genişletme
- Eğitmen dashboard (session oluştur, öğrencileri izle, toplu ETH)
- Achievement badge sistemi
- Dynamic NFT (sohbet kalitesine göre metadata değişimi)
- Peer-to-peer hazine avı mekaniği

### v0.3 — Olgunlaşma
- ERC-8004 agent identity (on-chain kimlik)
- Multi-agent orkestrasyon
- Agent-to-agent ticaret
- Reputation sistemi
- On-chain credential (SBT)

### v1.0 — Tam Platform
- Visual agent builder (drag & drop)
- Agent yaşam döngüsü yönetimi
- Cross-workshop agent taşınabilirliği
- Analytics dashboard
- Mainnet deployment seçeneği

---

*Bu döküman Agent Arena v0.1.0 (Mersin Workshop Release) kod tabanından otomatik olarak derlenmiştir.*
