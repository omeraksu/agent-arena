# Agent Arena — Proje Raporu
## Grant ve Fonlama Başvuruları İçin

---

## Yönetici Özeti

Agent Arena, blockchain eğitimindeki erişim engellerini (cüzdan kurulumu, gas ücreti, teknik karmaşıklık) ortadan kaldıran, AI agent etkileşimli bir workshop platformudur. 7 Mart 2026'da Mersin'de 24 öğrenciyle (11–17 yaş) gerçekleştirilen pilot workshop'ta %75 tam tamamlama oranı elde edilmiş olup bu oran sektör ortalamasının (%40–50) 1.5 katı üzerindedir.

---

## Problem Tanımı

### Blockchain Eğitiminde Erişim Engelleri

Blockchain teknolojisinin yaygınlaşması için genç nesillerin bu teknolojiyi anlaması kritik önem taşıyor. Ancak mevcut eğitim yaklaşımları ciddi engellerle karşı karşıya:

1. **Teknik sürtünme:** Cüzdan kurulumu (MetaMask vb.), seed phrase yönetimi, browser extension gereksinimi — okul lab bilgisayarlarında uygulanması neredeyse imkansız
2. **Gas ücreti bariyeri:** İlk deneyim için bile kripto para edinme ve gas ücreti ödeme zorunluluğu
3. **Teori-pratik uçurumu:** Öğrenciler blockchain'i "veri saklama/kayıt tutma" olarak tanımlıyor; transfer, sahiplik ve şeffaflık kavramları soyut kalıyor
4. **Yaş uygunluğu:** Mevcut blockchain eğitim araçları yetişkinler için tasarlanmış — 11–17 yaş grubuna uygun interaktif çözümler yok
5. **Pasif öğrenme:** "Buton tıkla → mint" yaklaşımı, kavramsal öğrenme sağlamıyor

### Ölçek

Türkiye'de yalnızca ortaokul ve lise düzeyinde yaklaşık 10 milyon öğrenci bulunmakta. Bu öğrencilerin dijital okuryazarlık kapsamında blockchain ve AI kavramlarına erişimi son derece sınırlı.

---

## Çözüm: Agent Arena

Agent Arena, yukarıdaki sorunların her birine doğrudan çözüm üreten bir workshop platformudur.

### Zero-Barrier Blockchain Deneyimi

- **Embedded wallet:** Email veya Google login ile otomatik cüzdan oluşturma — kurulum yok, seed phrase yok
- **Gasless transaction:** Account Abstraction (Paymaster) ile tüm gas maliyetleri platform tarafından karşılanır — öğrenci hiçbir ödeme yapmaz
- **Tarayıcı tabanlı:** Herhangi bir yazılım kurulumu gerektirmez — lab bilgisayarlarında doğrudan çalışır

### AI Agent ile İnteraktif Öğrenme

- **Pazarlıkçı Ajan mekaniği:** Öğrenciler NFT kazanmak için bir AI agent'ı blockchain bilgileriyle **ikna** etmeli — pasif değil, aktif öğrenme
- **Kavramsal düzeltme:** Agent, yaygın yanılgıları (örn. "blockchain = veri saklama") tespit ederek interaktif olarak düzeltir
- **Kişiselleştirilmiş deneyim:** 5 farklı agent arketipi (Hacker, Sage, Korsan, Scientist, Glitch) ile her öğrenci kendi tarzına uygun bir agent oluşturur

### Gamification ve Sosyal Deneyim

- **XP sistemi:** Her aktivite (cüzdan oluşturma, transfer, quiz, NFT mint) XP kazandırır
- **Canlı sınıf feed'i:** Tüm işlemler anlık olarak sınıfça izlenir — blockchain şeffaflığının canlı kanıtı
- **Rekabet ve işbirliği:** Sınıf XP hedefleri, agent'lar arası mesajlaşma

### Workshop-First Tasarım

- Her aktivite maksimum 15 dakika (dikkat süresi verisine dayalı)
- 5. sınıf öğrencisinin de rahatça kullanacağı sezgisel UI
- Eğitmen dashboard'u ile canlı takip ve yönlendirme

---

## Pilot Sonuçları — Mersin Workshop (7 Mart 2026)

### Workshop Bilgileri

| | |
|---|---|
| **Tarih** | 7 Mart 2026 |
| **Yer** | Güney Gelişim Koleji, Mersin |
| **Hedef kitle** | 5. sınıf – 11. sınıf (11–17 yaş) |
| **Süre** | 3 saat |
| **Ön quiz katılımcısı** | 45 öğrenci |
| **Workshop aktif katılımcı** | 24 öğrenci |
| **Ağ** | Avalanche Fuji Testnet |

### Ön Quiz Profili

Workshop öncesi uygulanan 10 soruluk quiz ile öğrencilerin mevcut bilgi seviyesi ölçüldü:

- **Ortalama puan:** 80/100 — beklenenin üzerinde
- **AI agent kavramı:** %81 doğru
- **AI çalışma döngüsü:** %95 doğru
- **Blockchain temel özelliği:** %84 doğru
- **Kritik yanılgı:** Öğrencilerin büyük çoğunluğu blockchain'i yalnızca "bilgi saklama" olarak tanımlıyor

### Workshop Sonuçları

| Metrik | Değer | Karşılaştırma |
|---|---|---|
| **Tam tamamlama oranı** | %75 (18/24) | Sektör ortalaması: %40–50 |
| **On-chain transfer** | 70 işlem | — |
| **NFT mint** | 53 işlem | — |
| **Transfer edilen AVAX** | 0.781 AVAX | — |
| **Benzersiz aktif cüzdan** | 25 | — |
| **AI chat oturumu** | 48 | — |
| **Toplam AI mesaj** | 502 | Ortalama 10.5 mesaj/oturum |
| **Kesintisiz engagement** | 3 saat | Quiz dikkat süresi: 6 dk |

### Engagement Kalitesi

Workshop boyunca aktivite dağılımı, sürekli ve artan bir ilgiyi gösteriyor:

| Dönem | Aktivite | Yorum |
|---|---|---|
| İlk saat | ~150 event | Giriş, cüzdan, faucet |
| İkinci saat | 424 event | **Zirve** — agent chat, NFT, transferler |
| Üçüncü saat | ~130 event | Serbest keşif, ilgi devam ediyor |

Bu dağılım kritik: öğrenciler 1 saat sonra sıkılmadı, aksine en aktif dönemlerine girdi. 6 dakikalık ortalama quiz süresiyle ölçülen kısa dikkat süresine rağmen, 3 saat boyunca kesintisiz engagement sağlandı.

### Kavramsal Dönüşüm

| Öncesi | Sonrası |
|---|---|
| "Blockchain bilgi saklar" | Bizzat transfer yaparak **sahiplik** kavramını deneyimleme |
| "Kayıt tutma aracı" | Canlı feed'de tüm sınıfın işlemlerini görerek **şeffaflık** deneyimi |
| "AI sihirli bir kutu" | Agent ile sohbet ederek AI'ın kurallarla çalışan bir sistem olduğunu görme |

---

## Teknik Altyapı

### Mimari

```
React SPA (Vite + TypeScript + Tailwind CSS)
    ├── thirdweb In-App Wallet + Account Abstraction
    │       └── Gasless transaction (Paymaster)
    ├── Supabase Realtime (canlı feed + veri depolama)
    └── Vercel Edge Functions (11 endpoint)
            ├── Anthropic Claude API (AI agent)
            ├── Faucet (test AVAX dağıtımı)
            └── Mint (NFT basımı)

Avalanche Fuji Testnet
    └── WorkshopNFT (ERC-721)
```

### Tech Stack

| Katman | Teknoloji | Seçim Gerekçesi |
|---|---|---|
| Frontend | React + Vite + TypeScript | Hızlı geliştirme, lab tarayıcılarında sorunsuz |
| Stil | Tailwind CSS | Hızlı prototipleme, cyberpunk temalı UI |
| Cüzdan | thirdweb In-App Wallet + AA | Email/Google login, gasless tx, ücretsiz tier |
| Blockchain | Avalanche Fuji Testnet | Hızlı, ucuz, geniş ekosistem |
| AI | Anthropic Claude API | Tool use desteği, interaktif agent mekaniği |
| Backend | Vercel Edge Functions | Ayrı backend servisi gerektirmez |
| Realtime | Supabase | PostgreSQL + realtime subscriptions |
| Deploy | Vercel | Tek komutla deploy, edge network |

### Maliyet Yapısı

| Bileşen | Maliyet (Workshop Başına) |
|---|---|
| Vercel Hosting | Ücretsiz (Hobby plan) |
| Supabase | Ücretsiz (Free tier) |
| thirdweb | Ücretsiz (Free tier) |
| Claude API | ~$2–5 (500 mesaj) |
| Avalanche Fuji | Ücretsiz (testnet) |
| **Toplam** | **~$2–5** |

Bu son derece düşük operasyon maliyeti, platformun hızla ölçeklenmesini mümkün kılıyor.

---

## Ölçeklenme Planı

### v0.2 — Çoklu Workshop Desteği (Q2 2026)
- Agent builder: öğrencilerin kendi AI agent'larını oluşturması
- Eğitmen dashboard: çoklu workshop yönetimi, öğrenci takibi
- Achievement sistemi: on-chain rozetler, dinamik NFT
- Peer-to-peer hazine avı mekaniği

### v0.3 — On-Chain Kimlik (Q3 2026)
- ERC-8004 agent identity: on-chain agent kimliği
- Multi-agent orkestrasyon: agent'lar arası etkileşim
- Soulbound Token: workshop tamamlama kanıtı
- Reputation sistemi

### v1.0 — Tam Platform (Q4 2026)
- Visual agent builder (drag & drop)
- Cross-workshop agent taşınabilirliği
- Mainnet deployment seçeneği
- Analytics dashboard
- Beyaz etiket (white-label) desteği — farklı kurumlar kendi workshop'larını düzenleyebilir

### Ölçek Hedefleri

| Dönem | Workshop Sayısı | Tahmini Katılımcı |
|---|---|---|
| Q2 2026 | 3–5 workshop | 100–150 öğrenci |
| Q3 2026 | 10+ workshop | 300–500 öğrenci |
| Q4 2026 | 20+ workshop | 1,000+ öğrenci |
| 2027 | Sürekli platform | 5,000+ öğrenci |

---

## Ekip

### Koza DAO
Blockchain eğitimi ve topluluk geliştirme odaklı DAO. Türkiye'de blockchain okuryazarlığını artırmayı hedefliyor.

### Team1
Teknik geliştirme ve platform mühendisliği. Agent Arena'nın tasarımı, geliştirilmesi ve workshop operasyonlarından sorumlu.

---

## Etki Metrikleri Özeti

| Metrik | Değer |
|---|---|
| **Pilot workshop tarihi** | 7 Mart 2026 |
| **Aktif katılımcı** | 24 öğrenci |
| **Yaş aralığı** | 11–17 (5.–11. sınıf) |
| **Tam tamamlama oranı** | %75 |
| **Sektör ortalaması** | %40–50 |
| **Sektör ortalamasına göre** | 1.5x üzeri |
| **On-chain transfer** | 70 |
| **NFT mint** | 53 |
| **AI chat oturumu** | 48 |
| **AI mesaj** | 502 |
| **Engagement süresi** | 3 saat (kesintisiz) |
| **Workshop başına maliyet** | ~$2–5 |
| **Kurulum süresi** | 0 (tarayıcı tabanlı) |
| **Gerekli yazılım** | Yok (sadece tarayıcı) |
| **Ön quiz katılımcısı** | 45 öğrenci |
| **Ön quiz ortalaması** | 80/100 |
| **Blockchain ağı** | Avalanche Fuji Testnet |
| **Smart contract** | ERC-721 (WorkshopNFT) |
| **Platform** | Açık kaynak potansiyeli olan tek SPA |

---

*Bu rapor Agent Arena v0.1 pilot workshop verileri baz alınarak hazırlanmıştır.*
*Platform: [agent-arena.vercel.app](https://agent-arena.vercel.app)*
*Koza DAO + Team1 — Mart 2026*
