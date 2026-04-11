# ARIA Hub — TIER 1 Security Analysis Report

**Tarih:** 2026-03-11
**Analiz Ekibi:** Cem (UX), Selin (UI), Deniz (Frontend), Kaan (Backend), Elif (PO)

---

## Tespit Edilen Kritik Guvenlik Aciklari

### 1. Address Validation Yetersiz
**Ciddiyet:** Yuksek
**Etkilenen dosyalar:** `api/faucet.ts`, `api/mint.ts`, `api/names.ts`, `api/treasure.ts`, `api/signal-pulse.ts`

**Sorun:** Address validation sadece `startsWith("0x")` kontrolu yapiyordu. `"0xinvalid"`, `"0x123"` gibi gecersiz adresler kabul ediliyordu.

**Cozum:** `api/_lib/validation.ts` dosyasinda `isValidAddress()` helper'i olusturuldu. Tum endpoint'lere uygulandi. Regex: `/^0x[0-9a-fA-F]{40}$/i`

### 2. VITE_SUPABASE_ANON_KEY Backend Fallback
**Ciddiyet:** Yuksek
**Etkilenen dosya:** `api/_lib/supabase.ts`

**Sorun:** Backend Supabase client'i `SUPABASE_SERVICE_KEY` bulamazsa `VITE_SUPABASE_ANON_KEY`'e fallback yapiyordu. Bu, backend'in anon key ile (dusuk yetkili) calismasi anlamina geliyordu — RLS bypass edilemez, veri yazma sorunlari olusabilirdi.

**Cozum:** Fallback kaldirildi. Backend her zaman `SUPABASE_SERVICE_KEY` kullanmali, yoksa Supabase devre disi kalir (mevcut null-check zaten var).

### 3. Instructor Password Hardcoded Fallback
**Ciddiyet:** Kritik
**Etkilenen dosyalar:** `api/instructor.ts`, `api/treasure.ts`, `api/signal-pulse.ts`, `api/lobby.ts`

**Sorun:** Tum instructor endpoint'lerinde `process.env.INSTRUCTOR_PASSWORD || "arena2026"` fallback'i vardi. Env var atanmazsa varsayilan sifre `"arena2026"` ile erisim mumkundu. Ayrica `===` string karsilastirmasi timing attack'a acikti.

**Cozum:**
- Fallback kaldirildi — env var zorunlu, yoksa 503 doner
- `timingSafeEqual` ile timing-safe karsilastirma (`safePasswordCompare()` helper)
- Tum 4 dosyada tum password kontrolleri guncellendi

### 4. Faucet Race Condition
**Ciddiyet:** Orta-Yuksek
**Etkilenen dosya:** `api/faucet.ts`

**Sorun:** `getRequestCount()` ve `incrementRequestCount()` ayri islemlerdi. Iki esanli istek ayni anda count=0 okuyup ikisi de geciyor olabilirdi.

**Cozum:** `atomicCheckAndIncrement()` fonksiyonu — insert-first yaklasimi ile race condition minimize edildi. Insert basarisiz olursa (row zaten var) read+increment yapilir.

### 5. Chat Rate Limit Cold Start Sorunu
**Ciddiyet:** Orta
**Etkilenen dosya:** `api/agent.ts`

**Sorun:** Chat rate limit sadece in-memory `BoundedMap` kullaniyor. Vercel serverless cold start'ta sifirlaniyor — ogrenci limit asimi yapabilirdi.

**Cozum:** Supabase `rate_limits` tablosu kullanilarak persistent rate limiting eklendi. `chat:{key}` prefix'i ile faucet rate limit'leriyle ayni tablo paylasiliyor. BoundedMap fallback olarak korundu (Supabase baglantisi yoksa).

---

## Uygulanan Degisiklikler Ozeti

| Dosya | Degisiklik |
|---|---|
| `api/_lib/validation.ts` | **YENI** — `isValidAddress()` + `safePasswordCompare()` |
| `api/_lib/supabase.ts` | VITE_SUPABASE_ANON_KEY fallback kaldirildi |
| `api/faucet.ts` | Address validation + atomic rate limit |
| `api/mint.ts` | Address validation |
| `api/names.ts` | Address validation (POST) |
| `api/treasure.ts` | Address validation + password guclendirildi |
| `api/signal-pulse.ts` | Address validation + password guclendirildi |
| `api/instructor.ts` | Password guclendirildi |
| `api/lobby.ts` | Password guclendirildi (3 action) |
| `api/agent.ts` | Chat rate limit Supabase'e tasindi |

---

## Dogrulama Kontrol Listesi
- [ ] `npm run build` basarili
- [ ] Address: `"0xinvalid"` ile faucet cagrisi → 400
- [ ] Address: `"hello"` ile names cagrisi → 400
- [ ] Instructor: Password olmadan (env var yok) → 503
- [ ] Instructor: Yanlis password → 401
- [ ] Faucet: Rate limit asimi → 429
- [ ] Chat: 60+ mesaj → 429
