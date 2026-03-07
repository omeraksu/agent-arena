# Agent Arena — Eğitim Deneyimi İyileştirme Promptu

## Bağlam

Agent Arena, Avalanche Fuji testnet üzerinde çalışan bir blockchain workshop platformu. Hedef kitle lise ve üniversite öğrencileri (45 kişilik gruplar). Platform React + Vite + Tailwind frontend, Vercel Serverless Functions backend, Supabase realtime DB kullanıyor.

Bu prompt'taki değişikliklerin tamamı **mevcut mimariyi bozmadan** yapılmalı. Yeni dosya yaratma, mevcut component ve config dosyalarını düzenleme öncelikli yaklaşım.

---

## Görev 1 — Milestone Kalibrasyonu (ÖNCE YAP)

**Dosya:** `src/config/constants.ts`

`SQUAD_MILESTONES` array'ini bul ve şu değerlerle güncelle:

```typescript
export const SQUAD_MILESTONES = [
  {
    xp: 300,
    title: "İlk Kıvılcım",
    message: "Sınıf ilk adımı attı! Zincir uyanıyor.",
    emoji: "⚡"
  },
  {
    xp: 1500,
    title: "Zincir Uyanıyor",
    message: "Bloklar birbirini takip ediyor! Momentum kazandınız.",
    emoji: "🔗"
  },
  {
    xp: 4000,
    title: "Ağ Kuruldu",
    message: "Sınıf olarak bir ağ oluşturdunuz. Bu blockchain.",
    emoji: "🌐"
  },
  {
    xp: 7500,
    title: "Arena Efsanesi",
    message: "Workshop rekoru! Bu sınıf tarihe geçti.",
    emoji: "🏆"
  }
]
```

**Neden:** 45 kişilik workshop'ta teorik maksimum XP ~9.000-12.000 arasında. Eski 10.000 eşiği ulaşılamaz ve demotive eder. İlk milestone (300 XP) workshop'un ilk 10 dakikasında gelecek şekilde kalibre edildi — erken başarı hissi motivasyonu kurar.

Aynı dosyada XP değerlerini de kontrol et, eğer aşağıdakilerden farklıysa güncelle:

```typescript
export const XP_VALUES = {
  WALLET_CREATED: 10,
  FAUCET_USED: 20,
  TRANSFER_SENT: 30,
  AGENT_REGISTERED: 25,
  QUIZ_COMPLETED: 100,
  NFT_MINTED: 200,
}
```

---

## Görev 2 — Adımlı Açılım (WORKSHOP'UN KALBİ)

**Dosya:** `src/components/Hub.tsx`

### 2a. Step State Ekle

Hub bileşeninin en üstüne step yönetimi ekle:

```typescript
type WorkshopStep = 'wallet' | 'faucet' | 'agent' | 'free'

const STEP_ORDER: WorkshopStep[] = ['wallet', 'faucet', 'agent', 'free']

const STEP_META = {
  wallet: {
    label: '1. Cüzdanını Oluştur',
    description: 'Workshop\'a katılmak için önce bir cüzdan oluştur.',
    unlockCondition: 'walletAddress !== null'
  },
  faucet: {
    label: '2. Test AVAX Al',
    description: 'İşlem yapmak için biraz test tokeni al.',
    unlockCondition: 'faucetUsed === true'
  },
  agent: {
    label: '3. Ajanını Seç',
    description: 'Seni temsil edecek ajan arketipini seç ve kaydet.',
    unlockCondition: 'agentRegistered === true'
  },
  free: {
    label: '🟢 Hazırsın',
    description: 'Tüm özellikler açık.',
    unlockCondition: null
  }
}
```

State:
```typescript
const [currentStep, setCurrentStep] = useState<WorkshopStep>('wallet')
const [completedSteps, setCompletedSteps] = useState<Set<WorkshopStep>>(new Set())
```

### 2b. Step İlerleme Mantığı

Her adımın tamamlanma koşulunu mevcut state/hook'lardan türet:

- `wallet` tamamlandı → `walletAddress` null değil (thirdweb hook'u kullan)
- `faucet` tamamlandı → faucet API'den başarılı response geldi (mevcut faucet logic'inde `onSuccess` callback'i varsa oraya ekle, yoksa local state)
- `agent` tamamlandı → agent kayıt API'den başarılı response geldi

useEffect ile izle:

```typescript
useEffect(() => {
  if (walletAddress && !completedSteps.has('wallet')) {
    markStepComplete('wallet')
  }
}, [walletAddress])

const markStepComplete = (step: WorkshopStep) => {
  setCompletedSteps(prev => new Set([...prev, step]))
  const nextIndex = STEP_ORDER.indexOf(step) + 1
  if (nextIndex < STEP_ORDER.length) {
    setCurrentStep(STEP_ORDER[nextIndex])
  }
}
```

### 2c. Step Progress Bar Bileşeni

Hub'ın üst kısmına `free` step'e gelinene kadar görünür kalacak bir ilerleme çubuğu ekle:

```tsx
{currentStep !== 'free' && (
  <div className="step-progress-bar">
    {STEP_ORDER.filter(s => s !== 'free').map((step, i) => (
      <div
        key={step}
        className={`step-item ${
          completedSteps.has(step) ? 'completed' :
          currentStep === step ? 'active' : 'locked'
        }`}
      >
        <div className="step-dot">
          {completedSteps.has(step) ? '✓' : i + 1}
        </div>
        <span className="step-label">{STEP_META[step].label}</span>
      </div>
    ))}
  </div>
)}
```

### 2d. Modül Kilitleme

Hub içindeki diğer modülleri (TransferForm, ProfilePage, LiveFeed vb.) şu şekilde sar:

```tsx
const isUnlocked = (requiredStep: WorkshopStep) => {
  const requiredIndex = STEP_ORDER.indexOf(requiredStep)
  const currentIndex = STEP_ORDER.indexOf(currentStep)
  return currentIndex >= requiredIndex || completedSteps.has(requiredStep)
}

// Kullanımı:
<LockedOverlay
  locked={!isUnlocked('faucet')}
  message="Önce test AVAX al"
>
  <TransferForm />
</LockedOverlay>
```

Basit `LockedOverlay` bileşeni (aynı dosyada veya `src/components/LockedOverlay.tsx`):

```tsx
const LockedOverlay = ({ locked, message, children }) => {
  if (!locked) return children
  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <span>🔒</span>
          <span>{message}</span>
        </div>
      </div>
    </div>
  )
}
```

Adım gereksinimleri:
- `TransferForm` → `faucet` adımı tamamlanmış olmalı
- `AgentChat` → `agent` adımı tamamlanmış olmalı
- `ProfilePage` → `agent` adımı tamamlanmış olmalı
- `LiveFeed` → her zaman açık (sosyal kanıt için)
- `SquadMilestone` → her zaman açık

---

## Görev 3 — Chat Layout Entegrasyonu

**Dosya:** `src/components/Hub.tsx` (layout kısmı)

Hub'ın ana layout'unu iki kolonlu yap. Chat her zaman sağ panelde görünsün.

```tsx
<div className="hub-layout">
  {/* Sol/Ana alan */}
  <div className="hub-main">
    {currentStep !== 'free' && <StepProgressBar />}
    <SquadMilestone />
    <LiveFeed />
    <div className="hub-modules-grid">
      <WalletModule />
      <TransferForm />
      {/* diğer modüller */}
    </div>
  </div>

  {/* Sağ panel — sabit chat */}
  <div className="hub-chat-panel">
    <AgentChat />
  </div>
</div>
```

CSS (Tailwind utility class'ları ile):

```
hub-layout: flex gap-4 h-screen
hub-main: flex-1 overflow-y-auto p-4
hub-chat-panel: w-96 flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-white/10
```

**Mobil davranış:** `md:flex` kullan, mobilde chat toggle ile ayrı tab olarak açılsın. Hub'ın alt kısmına sticky tab bar ekle:

```tsx
// Mobilde görünür, md:hidden
<div className="fixed bottom-0 left-0 right-0 flex md:hidden border-t border-white/10 bg-black">
  <button
    className={`flex-1 py-3 text-sm ${activeTab === 'hub' ? 'text-white' : 'text-white/40'}`}
    onClick={() => setActiveTab('hub')}
  >
    🏠 Hub
  </button>
  <button
    className={`flex-1 py-3 text-sm ${activeTab === 'chat' ? 'text-white' : 'text-white/40'}`}
    onClick={() => setActiveTab('chat')}
  >
    💬 Ajan
  </button>
</div>
```

---

## Görev 4 — Oracle Kapanış Ritüeli

### 4a. Supabase'e Session State Ekle

**Dosya:** `api/instructor.ts`

Instructor endpoint'ine `end_workshop` action'ı ekle:

```typescript
if (action === 'end_workshop') {
  // Supabase'de session state'i güncelle
  await supabase
    .from('sessions') // tablo adını mevcut schema'ya göre ayarla
    .update({ workshop_ended: true, ended_at: new Date().toISOString() })
    .eq('session_id', sessionId)

  // Broadcast gönder
  await supabase
    .from('activity')
    .insert({
      type: 'WORKSHOP_ENDED',
      message: 'Workshop tamamlandı! Oracle\'ınız hazır. Profil sayfana git ve karakterini keşfet.',
      metadata: { special: true },
      created_at: new Date().toISOString()
    })

  return res.json({ success: true, action: 'workshop_ended' })
}
```

### 4b. Instructor Paneline Buton Ekle

**Dosya:** `src/components/InstructorPanel.tsx`

Mevcut broadcast ve freeze butonlarının yanına:

```tsx
<button
  onClick={handleEndWorkshop}
  className="end-workshop-btn bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition"
>
  🏁 Workshop'u Bitir & Oracle'ı Aç
</button>
```

Handler:
```typescript
const handleEndWorkshop = async () => {
  const confirm = window.confirm(
    'Workshop\'u bitirmek istediğinizden emin misiniz? Tüm öğrencilere Oracle bildirimi gönderilecek.'
  )
  if (!confirm) return

  await fetch('/api/instructor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-instructor-password': password
    },
    body: JSON.stringify({ action: 'end_workshop', sessionId })
  })
}
```

### 4c. LiveFeed'de Workshop Sonu Banner'ı

**Dosya:** `src/components/LiveFeed.tsx`

Supabase realtime subscription'da `WORKSHOP_ENDED` tipini yakala:

```typescript
if (activity.type === 'WORKSHOP_ENDED') {
  setWorkshopEnded(true) // ayrı state
}
```

Banner (feed'in en üstüne sabitlenmiş):

```tsx
{workshopEnded && (
  <div className="workshop-ended-banner sticky top-0 z-10 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-4 mb-4 text-center animate-pulse">
    <div className="text-2xl mb-1">🔮</div>
    <div className="font-bold text-amber-400">Workshop Tamamlandı!</div>
    <div className="text-sm text-white/70 mt-1">
      Oracle'ın seni analiz etti. Profil sayfana git ve karakterini keşfet.
    </div>
    <a
      href="/profile"
      className="inline-block mt-2 bg-amber-500 text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-amber-400 transition"
    >
      Oracle'ıma Git →
    </a>
  </div>
)}
```

### 4d. ProfilePage'de Oracle Butonu State'i

**Dosya:** `src/components/ProfilePage.tsx`

Oracle butonu şu an her zaman aktif. Bunu iki aşamalı yap:

```tsx
const OracleButton = ({ workshopEnded, onRequest }) => {
  if (!workshopEnded) {
    return (
      <button disabled className="oracle-btn opacity-40 cursor-not-allowed">
        🔮 Oracle analizi henüz hazır değil
        <span className="block text-xs mt-1 text-white/50">
          Eğitmen workshop'u bitirince aktif olacak
        </span>
      </button>
    )
  }
  return (
    <button onClick={onRequest} className="oracle-btn active">
      🔮 Oracle Analizini Başlat
    </button>
  )
}
```

`workshopEnded` state'ini Supabase'den çek (session tablosunu sorgula veya realtime subscribe ol).

---

## Görev 5 — Bağlamsal Quiz Tetikleme

**Dosya:** `api/agent.ts` + `src/components/AgentChat.tsx`

### 5a. Backend'de Mint Sonrası Quiz Flag'i

`agent.ts` endpoint'inde, eğer AI response'u `[MINT_APPROVED]` tag'i içeriyorsa response'a `triggerQuiz: true` ekle:

```typescript
const aiResponse = // ... mevcut Claude API çağrısı

const mintApproved = aiResponse.includes('[MINT_APPROVED]')

return res.json({
  message: aiResponse,
  mintApproved,
  triggerQuiz: mintApproved, // Quiz tetikleyici flag
  energy: updatedEnergy
})
```

### 5b. Quiz Sorularını constants.ts'e Ekle

**Dosya:** `src/config/constants.ts`

```typescript
export const POST_MINT_QUIZ: Array<{
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}> = [
  {
    question: "NFT'ni az önce kim doğruladı?",
    options: [
      "Sadece sen",
      "Avalanche validator node'ları",
      "Workshop sunucusu",
      "Anthropic AI"
    ],
    correctIndex: 1,
    explanation: "Avalanche ağındaki validator node'lar işlemi doğrulayıp bloka ekledi. Merkezi bir otorite yok."
  },
  {
    question: "Bu NFT neden geri alınamaz?",
    options: [
      "Şifreli olduğu için",
      "Çok pahalı olduğu için",
      "Blockchain immutability — blok zincire eklendikten sonra değiştirilemez",
      "Sadece admin geri alabilir"
    ],
    correctIndex: 2,
    explanation: "Blockchain'e yazılan her işlem kalıcıdır. Bu merkezi bir veritabanından farkı."
  },
  {
    question: "İşlem için ödediğin gas ücreti nereye gitti?",
    options: [
      "Workshop organizatörüne",
      "Anthropic'e",
      "Validator node operatörlerine (ağı çalıştıranlara)",
      "Yakıldı (burn edildi)"
    ],
    correctIndex: 2,
    explanation: "Gas ücretleri ağı güvende tutan validator'lara teşvik olarak gider. Bu ağın ekonomik motoru."
  }
]
```

### 5c. Frontend'de Quiz Modal

**Dosya:** `src/components/AgentChat.tsx`

API response'unda `triggerQuiz: true` gelince bir modal aç:

```typescript
const handleAgentResponse = async (response) => {
  // mevcut logic...
  if (response.triggerQuiz) {
    setShowQuizModal(true)
    setCurrentQuiz(POST_MINT_QUIZ[Math.floor(Math.random() * POST_MINT_QUIZ.length)])
  }
}
```

Quiz modal bileşeni (AgentChat içinde veya ayrı dosya):

```tsx
{showQuizModal && currentQuiz && (
  <div className="quiz-modal-overlay fixed inset-0 bg-black/80 flex items-center justify-center z-50">
    <div className="quiz-modal bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
      <div className="text-xs text-amber-400 font-bold mb-2 uppercase tracking-wider">
        🔮 Oracle Soru Soruyor
      </div>
      <p className="text-white font-medium mb-4">{currentQuiz.question}</p>

      <div className="space-y-2">
        {currentQuiz.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleQuizAnswer(i)}
            className={`w-full text-left px-4 py-3 rounded-lg border transition text-sm
              ${quizAnswered
                ? i === currentQuiz.correctIndex
                  ? 'border-green-500 bg-green-500/20 text-green-300'
                  : selectedAnswer === i
                    ? 'border-red-500 bg-red-500/20 text-red-300'
                    : 'border-white/5 text-white/30'
                : 'border-white/10 hover:border-white/30 text-white'
              }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {quizAnswered && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm text-white/70">
          💡 {currentQuiz.explanation}
        </div>
      )}

      {quizAnswered && (
        <button
          onClick={() => {
            setShowQuizModal(false)
            setQuizAnswered(false)
            // XP ekle — mevcut XP sistemiyle entegre et
            if (selectedAnswer === currentQuiz.correctIndex) {
              // onXpEarned(XP_VALUES.QUIZ_COMPLETED) veya mevcut mechanism
            }
          }}
          className="mt-4 w-full bg-white text-black py-2 rounded-lg font-bold hover:bg-white/90 transition"
        >
          Devam Et →
        </button>
      )}
    </div>
  </div>
)}
```

---

## Genel Talimatlar

1. **Mevcut kodu silme.** Ekle veya güncelle. Eğer bir şeyi refactor ediyorsan eski davranışın korunduğundan emin ol.

2. **TypeScript tip hatalarına dikkat et.** Her yeni state, prop ve function için tip tanımı yaz.

3. **Supabase tablo adlarını kontrol et.** Prompt'taki tablo adları (`sessions`, `activity`) tahmini. Gerçek schema'ya göre güncelle. Şüphen varsa `supabase.ts` veya mevcut API dosyalarına bak.

4. **Her görev bağımsız.** Görevleri sırayla yap ama her biri diğerinden bağımsız çalışmalı. Görev 1'i yaparken görev 3 kırılmamalı.

5. **Test et.** Her görev sonrası şunu kontrol et:
   - Görev 1: `constants.ts`'i import eden bileşenler compile oluyor mu?
   - Görev 2: Step ilerlemesi doğru tetikleniyor mu? Kilitleme UI render ediyor mu?
   - Görev 3: Desktop'ta iki kolon, mobilde tab çalışıyor mu?
   - Görev 4: Broadcast Supabase'e yazılıyor mu? Banner görünüyor mu?
   - Görev 5: `[MINT_APPROVED]` tag'i gelince modal açılıyor mu?

6. **Vercel function limiti:** 11/12 kullanılıyor. Yeni endpoint açma. Mevcut endpoint'lere action parametresi ekleyerek genişlet (Görev 4'teki `end_workshop` gibi).

---

## Öncelik Sırası

```
GÖREV 1 → GÖREV 2 → GÖREV 4 → GÖREV 5 → GÖREV 3
```

Görev 3 (layout) en fazla refactor gerektirir, en sona bırak. Diğerleri config ve state değişiklikleri, daha güvenli.
