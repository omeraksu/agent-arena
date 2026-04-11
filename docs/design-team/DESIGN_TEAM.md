# Agent Arena — Design Team System

> Bu dosya `CLAUDE.md`'ye eklenecek design team bölümünü ve `.claude/agents/` altındaki agent prompt'larını içerir.
> txbfi design team yapısından esinlenilmiş, Agent Arena'ya özgü self-updating mimari.

---

## CLAUDE.md'ye Eklenecek Bölüm

Aşağıdaki bloğu mevcut CLAUDE.md'nin sonuna veya ilgili bölümüne ekle:

```markdown
## Design System & Team Architecture

### Figma Kaynak
- **File:** `ghCzy7dVnXFAHBovxmncjw`
- **Sayfalar:** 01 Foundations · 02 Components · 04 Archive · 05 Hub Mode · 06 Event Mode
- **Token collection:** "Agent Arena / Tokens" (55 variable, 2 mod: Hub/Event)
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
```

---

## Design Team Agent Tanımları

### Mimari: Self-Updating Team

```
┌─────────────────────────────────────────────┐
│              DESIGN LEAD (ARIA)              │
│   Koordinasyon · Karar · Figma MCP bridge    │
├──────────┬──────────┬──────────┬─────────────┤
│ ui-eng   │ ux-res   │ motion   │ token-sync  │
│ Implement│ Validate │ Animate  │ Sync state  │
└──────────┴──────────┴──────────┴─────────────┘
```

**Self-update mekanizması:**
1. Her sprint sonunda `token-sync` agent'ı Figma'dan güncel token/component sayısını çeker
2. `DESIGN_STATE.md` dosyası otomatik güncellenir (ekran sayısı, instance count, coverage)
3. CLAUDE.md'deki design system bölümü güncel kalır
4. Yeni component oluşturulduğunda component kataloğu otomatik genişler

---
