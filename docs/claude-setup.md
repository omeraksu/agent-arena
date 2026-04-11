# Claude Code Setup — ARIA Hub

Bu dosya, `/Users/omeraksu/https/agent-arena` projesinde çalışan Claude Code örneğinin tam yapılandırmasını dökümanlaştırır: hangi talimatları okuyor, hangi plugin/skill'ler yüklü, hangi MCP server'lara bağlı, hangi tool'ları kullanabiliyor.

> **Snapshot tarihi:** 2026-04-10
> **Çalışma dizini:** `/Users/omeraksu/https/agent-arena`
> **Model:** Claude Opus 4.6 (1M context)
> **Effort level:** `medium`

---

## 1. Talimat Dosyaları (CLAUDE.md + MEMORY.md)

Claude her konuşma başında iki dosyayı otomatik okur:

### 1.1 `CLAUDE.md` (proje) — 418 satır
**Konum:** `/Users/omeraksu/https/agent-arena/CLAUDE.md`
**Commit'li:** evet (repo kök dizininde)

**Ana bölümler:**
- **Proje nedir:** ARIA Hub — blockchain workshop platformu (Koza DAO + Team1)
- **Mevcut sprint:** v0.1 — "Mersin Workshop" (Güney Gelişim Koleji, 45 öğrenci, 11-17 yaş)
- **Katılımcı analizi:** Gelişim Challenge ön quiz verisi (ortalama 80/100, güçlü/zayıf yönler, öne çıkan öğrenciler)
- **8 temel tasarım ilkesi:** zero-barrier · biz her şeyi yapmıyoruz · workshop-first · incremental delivery · veri-odaklı UX · kayıt değil sahiplik · minimal mimari · sosyal deneyim
- **v0.1 mimarisi:** Tek Vite + React SPA, Vercel Edge Functions, thirdweb In-App Wallet + AA, Avalanche Fuji testnet, Supabase Realtime
- **5 modül:** Cüzdan · Pazarlıkçı Ajan Chat · Canlı Feed · Challenge/Quiz · Profil Sayfası
- **Workshop akışı:** 2 saatlik zaman çizelgesi (her aktivite ≤15dk)
- **Tech stack tablosu:** frontend/styling/wallet/chain/AI/backend/realtime/deploy
- **Dosya yapısı:** `src/components/`, `src/lib/`, `api/` (edge functions), `contracts/`
- **Agent system prompt (v0.1):** "Pazarlıkçı Ajan" rolü + kalibre edilmiş system prompt (2 mod: rehber + pazarlıkçı, `[MINT_APPROVED]` tag)
- **Ortam değişkenleri:** frontend (VITE_*) + backend (ANTHROPIC_API_KEY, THIRDWEB_SECRET_KEY vb.)
- **Roadmap:** v0.1 Mersin → v0.2 Eskişehir → v0.3 olgunlaşma → v1.0 tam platform
- **Claude Code çalışma notları:** kod stili, karar kuralları ("bu yarınki workshopta çalışır mı?")

### 1.2 `MEMORY.md` (auto-memory) — 38 satır
**Konum:** `~/.claude/projects/-Users-omeraksu-https-agent-arena/memory/MEMORY.md`
**Commit'li:** hayır (kullanıcıya özel)

**İçindekiler:**
- Proje durumu (son commit, branch, deploy)
- Bu session'da yapılanlar (badge sistemi, brand assets, NFT redesign, treasure API vb.)
- Key architecture notes (özet)
- Known issues / next steps
- User preferences (Türkçe iletişim, workshop-first mindset, minimal architecture)

**Memory türleri** (henüz sadece bir index var, tek dosya modeli kullanılıyor):
- `user` — kullanıcı rolü/tercihler
- `feedback` — onaylanmış/düzeltilmiş davranış kuralları
- `project` — proje durumu (yüksek değişim hızı)
- `reference` — dış sistem pointer'ları

---

## 2. Plugin'ler

Plugin listesi `~/.claude/plugins/installed_plugins.json`'dan geliyor; aktif durumları `~/.claude/settings.json` > `enabledPlugins`'te.

| Plugin | Versiyon | Marketplace | Durum |
|---|---|---|---|
| **figma@claude-plugins-official** | 2.1.3 | claude-plugins-official | ✅ enabled |
| **frontend-design@claude-plugins-official** | 1057d02c5307 | claude-plugins-official | ✅ enabled |
| **ui-ux-pro-max@ui-ux-pro-max-skill** | 2.0.1 | ui-ux-pro-max-skill | ✅ enabled |
| **understand-anything@understand-anything** | 1.1.1 | understand-anything (github: Lum1104/Understand-Anything) | ✅ enabled |

Plugin cache: `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`

---

## 3. Skill'ler (plugin'lerden gelen)

Her plugin bir veya daha fazla skill sağlıyor. Skill'ler `SKILL.md` frontmatter'ıyla tanımlı ve "triggered by description" mantığıyla çalışıyor (kullanıcı niyeti eşleşirse otomatik yükleniyor).

### 3.1 Figma plugin skill'leri (7 skill)

`~/.claude/plugins/cache/claude-plugins-official/figma/2.1.3/skills/`

| Skill | Amaç |
|---|---|
| **figma-use** | `use_figma` tool'u öncesi **zorunlu** yüklenir. Plugin API ile JS çalıştırmanın tüm kuralları, gotcha'lar, reference tipleri. |
| **figma-generate-design** | Kod → Figma ekran oluşturma workflow'u (design system component arama, import, incremental assembly). |
| **figma-create-new-file** | Yeni Figma dosyası oluşturma (plan/team key ile). |
| **figma-implement-design** | Figma → kod yönü: `get_design_context` ile tasarımı alıp projeye adapte etme. |
| **figma-generate-library** | Sıfırdan design system kütüphanesi kurma (tokens, components, variants, naming conventions, Code Connect setup). |
| **figma-code-connect** | Code Connect mapping yönetimi (component ↔ code dosyası eşleştirme). |
| **figma-create-design-system-rules** | Proje için design system kuralları üretme. |

### 3.2 Frontend Design plugin skill'i (1 skill)

`~/.claude/plugins/cache/claude-plugins-official/frontend-design/1057d02c5307/skills/frontend-design/SKILL.md`

| Skill | Amaç |
|---|---|
| **frontend-design** | "AI slop" kaçınan, bold estetik kararlı, production-grade frontend UI üretme. Ton/constraint/diferansiyon üzerine design thinking framework'ü. |

### 3.3 UI/UX Pro Max plugin skill'i (1 skill)

`~/.claude/plugins/cache/ui-ux-pro-max-skill/ui-ux-pro-max/2.0.1/.claude/skills/ui-ux-pro-max/SKILL.md`

| Skill | Amaç |
|---|---|
| **ui-ux-pro-max** | 50 stil · 97 palet · 57 font pairing · 99 UX kuralı · 25 chart tipi · 9 stack (React/Next/Vue/Svelte/SwiftUI/RN/Flutter/Tailwind/shadcn). Plan, build, review, fix, optimize aksiyonları için priorite tabanlı öneriler. |

### 3.4 Understand Anything plugin skill'leri (6 skill)

`~/.claude/plugins/cache/understand-anything/understand-anything/1.1.1/skills/`

| Skill | Amaç |
|---|---|
| **understand** | Ana skill: kod tabanından knowledge graph oluşturma. Alt promptlar: graph-reviewer, architecture-analyzer, project-scanner, file-analyzer, tour-builder. |
| **understand-onboard** | Yeni bir repo için ilk onboarding grafiği kurma. |
| **understand-explain** | Mevcut graph üzerinden belirli bir parçayı açıklama. |
| **understand-diff** | Graph diff: commits arasında yapısal değişimleri özetleme. |
| **understand-dashboard** | Graph dashboard'unu açma / query etme. |
| **understand-chat** | Graph ile sohbet modu. |

### 3.5 User-level custom commands (7 adet)

`~/.claude/commands/` — slash-command olarak invoke edilir (`/frontend-design`, `/simplify` vb.)

- `baseline-ui.md`
- `figma-code-connect.md`
- `figma-design-system-rules.md`
- `figma-implement-design.md`
- `frontend-design.md`
- `simplify.md`
- `ui-ux-pro-max.md`

---

## 4. MCP Server'lar

İki kaynak:

### 4.1 `~/.claude.json` > `mcpServers` (user tarafından kurulu, 3 server)

| Server | Transport | Amaç |
|---|---|---|
| **gemini** | stdio (`env ...`) | Gemini API client — 40+ tool: analyze-code/document/image/url, brainstorm, deep-research, dialogue, extract, generate-image/video, run-code, speak, summarize, YouTube, vb. |
| **gemini-cli** | stdio (`npx`) | Basitleştirilmiş Gemini CLI interface — ask-gemini, brainstorm, fetch-chunk, ping, timeout-test. |
| **stitch** | http | Design generation — create_project, create_design_system, generate_screen_from_text, generate_variants, edit_screens, list/get_project/screens. |

### 4.2 Claude.ai entegrasyonları (hesap tarafından, bu oturumda deferred tool olarak gelen)

Claude.ai hesabına bağlı MCP servisleri oturumda **deferred tools** olarak listelenir (kullanılmadan önce `ToolSearch` ile yüklenmeleri gerekir).

| Server | Ana kullanım |
|---|---|
| **claude.ai Figma** | Resmi Figma MCP (bu oturumda yoğun kullanıldı): `use_figma`, `get_design_context`, `get_metadata`, `get_screenshot`, `get_variable_defs`, `search_design_system`, `create_new_file`, `generate_diagram`, `whoami`, Code Connect mapping tool'ları. |
| **claude.ai Gmail** | Draft oluşturma, mesaj/thread okuma, arama, label listeleme, profil. |
| **claude.ai Google Drive** | Dosya oluşturma, içerik okuma/indirme, metadata, permissions, son dosyalar, arama. |
| **claude.ai Notion** | Page/database oluşturma, fetch, search, update, comment, user/team listeleme, page taşıma. |

---

## 5. Sub-Agent'lar (Task tool ile spawn edilenler)

Sub-agent'lar iki seviyede tanımlanır:

### 5.1 Global agent'lar (CLI built-in)
- **general-purpose** — karmaşık araştırma, çok-adımlı task'lar
- **statusline-setup** — Claude Code status line config
- **Explore** — hızlı codebase keşfi (quick/medium/very thorough seviyeleri)
- **Plan** — implementation planı tasarlama
- **claude-code-guide** — Claude Code/Agent SDK/API hakkında soru cevaplama

### 5.2 Proje sub-agent'ları (`.claude/agents/`)
**Konum:** `/Users/omeraksu/https/agent-arena/.claude/agents/` (commit'li)

| Agent | Rol |
|---|---|
| **ui-developer** | Senior UI dev — Design systems, Tailwind, animations, pixel-perfect implementation. |
| **ux-researcher** | Senior UX researcher — user research, usability testing, EdTech UX, genç kullanıcı davranışları. |
| **backend** | Senior backend engineer — Vercel Edge, Supabase, blockchain, API design, security. |
| **product-owner** | Senior PO — EdTech, Web3 onboarding, workshop tasarımı, scope management. |
| **frontend** | Senior frontend engineer — React, TypeScript, Vite, Web3 integrations, accessibility. |

Ayrıca plugin-bazlı: **understand-anything:knowledge-graph-guide** (understand-anything plugin'inden).

**Experimental feature:** `settings.json`'da `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` set — agent takımı özelliği açık.

---

## 6. Tool'lar

Tool'lar iki kategoride geliyor: **built-in** (her zaman yüklü) ve **deferred** (ihtiyaç halinde `ToolSearch` ile yüklenir).

### 6.1 Built-in tool'lar (her zaman hazır)

**Dosya sistemi:**
- `Read` — dosya oku (2000 satıra kadar, offset/limit, resim/PDF/notebook destekli)
- `Write` — dosya yaz (sadece gerekirse; Read sonrası edit tercih edilir)
- `Edit` — tam string replacement (replace_all opsiyonu)
- `Glob` — dosya pattern arama (`**/*.ts` gibi)
- `Grep` — ripgrep tabanlı içerik arama (multiline, context, type filter)

**Shell:**
- `Bash` — shell komut (run_in_background, timeout, sandbox opsiyonları; `find/grep/cat/sed` yerine dedicated tool tercih edilmeli)

**Agent/skill:**
- `Agent` — sub-agent spawn (yukarıda listelenenler + isolation=worktree)
- `Skill` — user-invocable skill çalıştır (slash-command)
- `ToolSearch` — deferred tool schema'larını yükle

### 6.2 Deferred tool'lar (bu oturumda yüklenenler)

**Task yönetimi:** `TaskCreate`, `TaskUpdate`, `TaskList`, `TaskGet`, `TaskStop`, `TaskOutput`

**Planlama:** `EnterPlanMode`, `ExitPlanMode`

**Kullanıcı etkileşimi:** `AskUserQuestion` (2-4 seçenekli sorular, preview/multiSelect destekli)

**Web:** `WebFetch`, `WebSearch`

**Teamwork:** `TeamCreate`, `TeamDelete`, `SendMessage`

**Cron:** `CronCreate`, `CronList`, `CronDelete`, `RemoteTrigger`

**Worktree:** `EnterWorktree`, `ExitWorktree`

**MCP resource:** `ListMcpResourcesTool`, `ReadMcpResourceTool`

**Notebook:** `NotebookEdit`

### 6.3 Deferred tool'lar (bu oturumda yüklenmedi ama mevcut)

Oturum başındaki deferred liste ~160 tool içeriyordu. Kullanılmayan kategoriler:
- **Gemini** (50+ tool): analyze-code/image/url/video, brainstorm, deep-research, dialogue, extract, generate-image/video/speech, run-code, search, summarize, YouTube, vb.
- **Gemini CLI** (6 tool)
- **Stitch** (10 tool): create_project, generate_screen_from_text, apply/create/update/list design_system, vb.
- **Gmail** (7 tool): create_draft, list_drafts/labels, read_message/thread, search, get_profile
- **Google Drive** (7 tool): create_file, download/read_file_content, metadata, permissions, search, list_recent
- **Notion** (13 tool): create-comment/database/pages/view, duplicate/move/update-page, fetch, search, get-comments/users/teams, update-data-source/view
- **Figma (claude.ai)** (16 tool): add_code_connect_map, create_design_system_rules, create_new_file, generate_diagram, get_code_connect_map/suggestions, get_context_for_code_connect, get_design_context, get_figjam, get_metadata, get_screenshot, get_variable_defs, search_design_system, send_code_connect_mappings, use_figma, whoami

---

## 7. Settings & Permissions

### 7.1 `~/.claude/settings.json` (global)
```json
{
  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" },
  "enabledPlugins": {
    "ui-ux-pro-max@ui-ux-pro-max-skill": true,
    "figma@claude-plugins-official": true,
    "frontend-design@claude-plugins-official": true,
    "understand-anything@understand-anything": true
  },
  "extraKnownMarketplaces": {
    "understand-anything": { "source": { "source": "github", "repo": "Lum1104/Understand-Anything" } }
  },
  "effortLevel": "medium"
}
```

### 7.2 `~/.claude/settings.local.json` (global permission allow-list)
Bash komutları için pre-approved prefix'ler:
- Package managers: `pip3 install:*`, `pip3:*`, `pipx install/ensurepath/inject:*`, `brew:*`, `brew install:*`
- GitHub CLI: `gh repo:*`, `gh api:*`
- Python: `python3:*`
- Sistem: `sysctl:*`, `export:*`, `~/.zshrc:*`
- Tools: `devduck:*`, `ollama list:*`, `scrapling install:*`
- WebFetch domains: `cagataycali.github.io`, `dev.duck.nyc`, `scrapling.readthedocs.io`

### 7.3 `.claude/settings.local.json` (proje)
**Konum:** `/Users/omeraksu/https/agent-arena/.claude/settings.local.json` — proje'ye özel permission'lar (içeriği burada tekrarlanmadı).

---

## 8. Dizin Yapısı (Claude state)

```
~/.claude/
├── CLAUDE.md                         (yok — global talimat kullanılmıyor)
├── settings.json                     (global ayarlar + enabled plugins)
├── settings.local.json               (global permission allow-list)
├── .claude.json                      (büyük state: mcpServers, projects, onboarding, vb.)
│
├── plugins/
│   ├── installed_plugins.json        (4 plugin kayıt)
│   ├── marketplaces/                 (3 marketplace: claude-plugins-official, ui-ux-pro-max-skill, understand-anything)
│   └── cache/                        (plugin source'ları)
│       ├── claude-plugins-official/
│       │   ├── figma/2.1.3/          (7 skill)
│       │   └── frontend-design/.../  (1 skill)
│       ├── ui-ux-pro-max-skill/2.0.1/ (1 skill)
│       └── understand-anything/1.1.1/ (6 skill + 1 agent)
│
├── commands/                         (7 user-level slash command)
│   ├── baseline-ui.md
│   ├── figma-code-connect.md
│   ├── figma-design-system-rules.md
│   ├── figma-implement-design.md
│   ├── frontend-design.md
│   ├── simplify.md
│   └── ui-ux-pro-max.md
│
├── projects/-Users-omeraksu-https-agent-arena/
│   ├── memory/
│   │   └── MEMORY.md                 (auto-memory index + user prefs)
│   └── *.jsonl                       (konuşma transkriptleri)
│
├── plans/                            (plan mode çıktıları)
│   └── snazzy-orbiting-tulip.md      (en son: ARIA Hub → Figma migration planı)
│
├── tasks/                            (task state)
├── todos/                            (todo state)
├── sessions/                         (oturum state)
├── session-env/                      (oturum env'leri)
├── file-history/                     (file edit history)
├── backups/
├── telemetry/
├── shell-snapshots/
└── debug/
```

**Proje tarafı:**
```
/Users/omeraksu/https/agent-arena/
├── CLAUDE.md                          (418 satır proje talimatı)
└── .claude/
    ├── settings.local.json
    └── agents/                        (5 proje sub-agent tanımı)
        ├── ui-developer.md
        ├── ux-researcher.md
        ├── backend.md
        ├── product-owner.md
        └── frontend.md
```

---

## 9. Çalışma Akışı Özeti

1. **Oturum başlar:** `CLAUDE.md` + `MEMORY.md` otomatik context'e yüklenir.
2. **Plugin'ler:** 4 plugin aktif. Skill'ler lazy-load — kullanıcı niyetine göre skill description match ederse çekilir.
3. **Tool'lar:** ~20 built-in + 160+ deferred. Deferred tool'lar `ToolSearch` ile ihtiyaç halinde yüklenir (her tool ilk kullanımdan önce).
4. **MCP:** 3 user-installed server (gemini/gemini-cli/stitch) + claude.ai hesabından 4 server (Figma/Gmail/Drive/Notion).
5. **Sub-agent:** Karmaşık işler için `Agent` tool ile spawn. Proje .claude/agents/ içindeki 5 özel agent (ui-developer, frontend, backend, product-owner, ux-researcher) ve built-in Explore/Plan/general-purpose.
6. **Memory:** Auto-memory `MEMORY.md` index'te; detaylı anılar type-tagged dosyalar olarak yazılır (user/feedback/project/reference).
7. **Plan mode:** Destructive task'lar öncesi EnterPlanMode/ExitPlanMode ile plan onayı (bu oturumda Figma migration planı böyle onaylandı).

---

## 10. Bu Oturumda Aktif Kullanılanlar (örnek)

ARIA Hub → Figma migration task'ında fiilen kullanılan subset:

- **CLAUDE.md** (proje talimatı) — design token kaynağı
- **MEMORY.md** — session state
- **Figma plugin (claude.ai)** — `use_figma`, `get_metadata`, `get_screenshot` tool'ları yoğun kullanıldı
- **Explore agent** × 2 (paralel) — codebase inventory + design token ekstraksiyonu
- **Plan agent** × 1 — Figma migration strategy tasarımı
- **TaskCreate/TaskUpdate** — 8 phase'lik progress tracking
- **Plan mode** — `snazzy-orbiting-tulip.md` plan dosyası onayı
- **AskUserQuestion** — scope/state detayı/mobile kararları için 3 soru
- **ToolSearch** — deferred tool'ların selective loading'i

---

## Kaynaklar

- Plugin listesi: `~/.claude/plugins/installed_plugins.json`
- Global settings: `~/.claude/settings.json`
- Proje sub-agent'lar: `/Users/omeraksu/https/agent-arena/.claude/agents/`
- MCP config: `~/.claude.json` > `mcpServers`
- Proje talimatı: `/Users/omeraksu/https/agent-arena/CLAUDE.md`
- Auto-memory: `~/.claude/projects/-Users-omeraksu-https-agent-arena/memory/MEMORY.md`
