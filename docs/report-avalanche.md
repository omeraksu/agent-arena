# ARIA Hub — Workshop Raporu
## Avalanche Ekosistem Ortakları İçin

**Tarih:** 7 Mart 2026
**Yer:** Güney Gelişim Koleji, Mersin
**Organizatör:** Koza DAO + Team1
**Ağ:** Avalanche Fuji Testnet

---

## Yönetici Özeti

ARIA Hub, 7 Mart 2026'da Mersin'de 24 lise ve ortaokul öğrencisiyle (11–17 yaş) Avalanche Fuji Testnet üzerinde 3 saatlik uygulamalı bir blockchain workshop'u gerçekleştirdi. Katılımcılar gasless transaction altyapısı sayesinde hiçbir teknik engel olmadan cüzdan oluşturdu, AVAX transferi yaptı ve AI agent etkileşimiyle NFT mint etti. Workshop %75 tam tamamlama oranıyla (sektör ortalaması %40–50) başarılı bir pilot oldu.

---

## Workshop Hakkında

| | |
|---|---|
| **Etkinlik** | ARIA Hub Blockchain Workshop |
| **Tarih** | 7 Mart 2026 |
| **Yer** | Güney Gelişim Koleji, Mersin |
| **Süre** | 3 saat (07:00–10:00 UTC) |
| **Hedef Kitle** | 5. sınıf – 11. sınıf öğrencileri (11–17 yaş) |
| **Katılımcı** | 24 aktif öğrenci |
| **Organizatör** | Koza DAO + Team1 |
| **Format** | Uygulamalı, tarayıcı tabanlı, lab ortamında |

---

## Avalanche Entegrasyonu

### Ağ ve Altyapı

| | |
|---|---|
| **Ağ** | Avalanche Fuji Testnet |
| **Chain ID** | 43113 |
| **RPC** | `https://api.avax-test.network/ext/bc/C/rpc` |
| **Explorer** | Snowtrace Testnet (`testnet.snowtrace.io`) |

### Gasless Transaction (Account Abstraction)

Workshop'un en kritik teknik özelliği gasless transaction desteğiydi. Öğrenciler:

- Gas kavramını bir **engel** olarak değil, bir **öğrenme konusu** olarak deneyimledi
- Cüzdan oluşturma, transfer ve NFT mint işlemlerinin tamamını gas ücreti ödemeden gerçekleştirdi
- thirdweb Account Abstraction (Paymaster) ile tüm gas maliyetleri platform tarafından karşılandı

Bu yaklaşım, 11 yaşındaki bir öğrencinin bile blockchain'i ilk dakikadan itibaren kullanabilmesini sağladı.

### WorkshopNFT Smart Contract

| | |
|---|---|
| **Kontrat Adresi** | `0x879800ace57A725D2fE93253a21c4D03fd902C36` |
| **Standart** | ERC-721 |
| **İsim** | ARIA Hub Workshop |
| **Sembol** | ARENA |
| **Mint Mekanizması** | Owner-controlled, backend tetiklemeli |
| **Snowtrace** | [Kontratı Görüntüle](https://testnet.snowtrace.io/address/0x879800ace57A725D2fE93253a21c4D03fd902C36) |

---

## On-Chain Metrikler

| Metrik | Değer |
|---|---|
| **Toplam AVAX transfer** | 70 işlem |
| **Transfer edilen toplam AVAX** | 0.781 AVAX |
| **Ortalama transfer** | 0.011 AVAX |
| **NFT mint işlemi** | 53 |
| **Benzersiz aktif cüzdan** | 25 |
| **Toplam on-chain event** | ~650 (spam hariç gerçek aktivite) |

### İşlem Dağılımı (Zamana Göre)

| Saat (UTC) | Event Sayısı | Açıklama |
|---|---|---|
| 07:00–08:00 | ~150 | Giriş, cüzdan oluşturma, faucet |
| 08:00–09:00 | 424 | Zirve: agent chat, NFT mint, transferler |
| 09:00–10:00 | ~130 | Serbest keşif, son mint'ler |

Ortadaki zirve, öğrencilerin workshop boyunca **artan** ilgi gösterdiğini kanıtlıyor — 1 saat sonra aktivite azalmak yerine en yüksek seviyeye ulaştı.

---

## Katılımcı Etkileşimi

| Metrik | Değer |
|---|---|
| **Aktif katılımcı** | 24 öğrenci |
| **Tam tamamlama oranı** | %75 (18/24) |
| **Sektör ortalaması** | %40–50 |
| **AI chat oturumu** | 48 |
| **Toplam AI mesaj** | 502 |
| **Kayıtlı AI agent** | 34 |
| **Kesintisiz engagement** | 3 saat |

### Katılımcı Hunisi

```
Cüzdan oluşturma     ████████████████████████████████  29
Faucet (AVAX alma)    ██████████████████████████████    26
Transfer yapma        █████████████████████████████     25
NFT mint              █████████████████████████████     25
Tam yolculuk          ████████████████████████          18
```

---

## Platform: ARIA Hub

### Sıfır Engel Yaklaşımı

ARIA Hub, blockchain eğitimindeki en büyük bariyerleri ortadan kaldıran bir workshop platformudur:

- **Embedded wallet:** thirdweb In-App Wallet ile email/Google login — MetaMask kurulumu, seed phrase veya browser extension gerektirmez
- **Gasless deneyim:** Account Abstraction sayesinde öğrenciler gas ücreti kavramını engel olarak değil, öğrenme konusu olarak deneyimledi
- **AI agent etkileşimi:** Öğrenciler bir AI agent'ı blockchain bilgisiyle ikna ederek NFT kazandı — pasif "buton tıkla" yerine aktif öğrenme
- **Canlı sınıf feed'i:** Tüm workshop işlemleri anlık olarak sınıfça izlendi — blockchain şeffaflığının canlı kanıtı

### Teknik Altyapı

| Katman | Teknoloji |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Cüzdan | thirdweb In-App Wallet + Account Abstraction |
| Blockchain | Avalanche Fuji Testnet |
| AI | Anthropic Claude API |
| Backend | Vercel Edge Functions (11 endpoint) |
| Realtime | Supabase Realtime |
| Deploy | Vercel (tek deploy) |

---

## Sonraki Adımlar

### Kısa Vadeli (v0.2)
- **Agent builder:** Öğrencilerin kendi AI agent'larını oluşturması (arketip seçimi, kişilik ayarları)
- **Eğitmen dashboard:** Çoklu workshop yönetimi, öğrenci takibi, toplu AVAX dağıtımı
- **Achievement sistemi:** On-chain rozetler, dinamik NFT metadata

### Orta Vadeli (v0.3)
- **ERC-8004 Agent Identity:** On-chain agent kimliği entegrasyonu
- **Multi-agent orkestrasyon:** Agent'lar arası etkileşim ve ticaret
- **On-chain credential:** Workshop tamamlama kanıtı (Soulbound Token)

### Uzun Vadeli
- **Avalanche Mainnet deployment:** Production-ready versiyon
- **C-Chain ve Subnet desteği:** Özel workshop subnet'leri
- **Çoklu şehir workshop ağı:** Türkiye genelinde yaygınlaştırma

### Avalanche Ekosistemi İçin Değer

- **Topluluk büyütme:** Her workshop 20–50 yeni kullanıcıyı Avalanche ekosistemine tanıştırıyor
- **Genç nesil onboarding:** 11–17 yaş arası — blockchain'in gelecek kullanıcıları
- **Gasless UX showcase:** Account Abstraction'ın gerçek dünya etkisinin kanıtı
- **Eğitim içeriği:** Türkçe blockchain eğitim materyali — Avalanche odaklı
- **Tekrarlanabilir model:** Her workshop öncekinin üzerine koyarak büyüyen bir platform

---

*Bu rapor ARIA Hub v0.1 Mersin Workshop verileri ve platform metrikleri baz alınarak hazırlanmıştır.*
*İletişim: Koza DAO — [agent-arena.vercel.app](https://agent-arena.vercel.app)*
