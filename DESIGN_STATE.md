# ARIA Hub — Design State
> Son güncelleme: 2026-04-10
> Güncelleyen: ARIA + token-sync (initial setup)

## Sayılar
- Figma ekranları: 17 (Hub: 7, Event: 10)
- Component'ler: 42 (12 kategori)
- Variable'lar: 55 (2 mod: Hub, Event) + 31 eski (temizlenmeli)
- Instance'lar: 55 (Hub: 30, Event: 25)
- Coverage: ~45% (çok sayıda raw element hala mevcut)

## Component Kataloğu
| Kategori | Sayı | İçerik |
|----------|------|--------|
| Button | 5 | Primary, Secondary, Ghost, Terminal, CTA |
| Badge | 7 | XP, Level, Streak, Quest, Online, Persuasion, Count |
| Pill | 4 | Purple, Amber, Blue, Teal |
| Tag | 5 | nft_mint, transfer, faucet, quiz, social |
| ProgressBar | 3 | XP, Quest, Persuasion |
| Input | 2 | Hub, Terminal |
| Card | 3 | Default, Active, Event |
| ChatBubble | 2 | Agent, User |
| Stat | 5 | Teal, Purple, Amber, Blue, Red |
| Avatar | 4 | Small, Medium, Large, Event |
| Nav | 1 | Bottom |
| Decoration | 1 | CornerMarks |

## Ekran Envanteri
### Hub Mode (05)
| Ekran | ID | Instance | Status |
|-------|----|----------|--------|
| MemberHub/Home | 69:3 | 4 | ✅ Connected |
| QuestArena | 70:2 | 4 | ✅ Connected |
| QuestDetail | 77:83 | 2 | ✅ Connected |
| Chat/HubMode | 71:2 | 8 | ✅ Connected |
| Profile | 71:53 | 6 | ✅ Connected |
| Leaderboard | 77:2 | 1 | ⚠️ Nav only |
| NFTDetail | varies | 1 | ⚠️ Nav only |

### Event Mode (06)
| Ekran | ID | Instance | Status |
|-------|----|----------|--------|
| SplashGate | 82:3 | 3 | ✅ Connected |
| ProfilingGate | 85:2 | 1 | ⚠️ CornerMarks only |
| AgentReveal | 90:2 | 3 | ✅ Connected |
| ChatSession | 85:37 | 8 | ✅ Connected |
| PersuasionMilestone | 85:144 | 1 | ⚠️ CornerMarks only |
| RewardGate | 85:104 | 2 | ✅ Connected |
| WalletConnect | 90:57 | 1 | ⚠️ CornerMarks only |
| NFTCelebration | 82:58 | 3 | ✅ Connected |
| ShareCard | 90:98 | 1 | ⚠️ CornerMarks only |
| SessionComplete | 82:116 | 2 | ✅ Connected |

## Bilinen Eksikler
1. ❌ Eski variable collection "AgentArena Tokens" (31 var) temizlenmeli
2. ⚠️ Chat Hub Mode — mesaj kartları auto-layout height fix gerekli
3. ⚠️ Nav component — Hub tab text kesiliyor
4. ⚠️ Component variant yapısı yok (active/inactive/disabled states)
5. ⚠️ Leaderboard, NFTDetail, WalletConnect, ShareCard — düşük instance coverage
6. ⚠️ Profiling Gate, Persuasion Milestone — sadece CornerMarks bağlı
7. 📋 Auto-layout tüm ekranlarda uygulanmamış
8. 📋 Variable binding (Figma variables → fills/strokes) yapılmamış
9. 📋 Transition/animation specleri eksik
10. 📋 Responsive davranış tanımlanmamış

## Son Değişiklikler
- 2026-04-10: İlk Figma dosya oluşturuldu, 17 ekran tasarlandı
- 2026-04-10: Avalanche-native renk paleti uygulandı (#E84142 anchor)
- 2026-04-10: 42 component library oluşturuldu
- 2026-04-10: 55 variable (2 mod) oluşturuldu
- 2026-04-10: 55 component instance bağlandı
- 2026-04-10: Dosya organizasyonu tamamlandı

## Sonraki Sprint Hedefleri
1. Instance coverage %80+ (mevcut ~45%)
2. Component variant'ları (active/inactive/disabled)
3. Auto-layout tüm ekranlara uygulama
4. Variable binding (token → element)
5. Tailwind config sync
6. Supabase schema implementation
