import { useState, useEffect, useCallback } from "react";
import { ConnectButton, useActiveAccount, useWalletBalance } from "thirdweb/react";
import { client, wallets, chain } from "@/lib/thirdweb";
import { requestFaucet, postActivity, registerName, resolveAddressToName } from "@/lib/api";
import { EXPLORER_ADDRESS_URL } from "@/config/constants";
import TransferForm from "./TransferForm";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}..${addr.slice(-4)}`;
}

/* ─── Agent-Zero Mentor ─── */

function getZeroMessages(step: number, hasBalance: boolean, arenaName?: string | null): string[] {
  const greeting = arenaName ? `${arenaName}.arena` : "hacker";
  switch (step) {
    case 0:
      return [
        "Selamm! Ben Agent-Zero 👾",
        "Slide'ları oku, blockchain'in ne olduğunu anla. Spoiler: sadece \"veri saklama\" değil.",
      ];
    case 1:
      return [
        "Şimdi dijital kimliğini oluşturuyoruz.",
        "Email veya Google ile giriş yap — bu adres senin blockchain'deki pasaportun.",
      ];
    case 2:
      return [
        "Cüzdanın hazır! Şimdi sana bir isim lazım.",
        "0x1a3f... gibi adresler hatırlanmaz. Kendine bir .arena ismi seç!",
      ];
    case 3:
      return hasBalance
        ? [
            `Güzel, ${greeting}! Cüzdanında zaten AVAX var 🔋`,
            "İstersen daha fazla al, ya da direkt transfer'e geç.",
          ]
        : [
            `${greeting}, cüzdanın hazır ama boş...`,
            "Test AVAX al — gerçek para değil, pratik için. Gas ücretini biz ödüyoruz 😎",
          ];
    case 4:
      return [
        `Son görev ${greeting}! Arkadaşına AVAX gönder.`,
        "Adresini veya .arena ismini yaz, miktarı gir, gönder!",
      ];
    case 5:
      return [
        `Tebrikler ${greeting}! Tüm adımları tamamladın 🎉`,
        "Blockchain'de gerçek işlemler yaptın. Şimdi Agent Chat'e geç, NFT kazan!",
      ];
    default:
      return ["..."];
  }
}

function AgentZero({ step, hasBalance = false, arenaName }: { step: number; hasBalance?: boolean; arenaName?: string | null }) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const messages = getZeroMessages(step, hasBalance, arenaName);

  // Reset when step changes
  useEffect(() => {
    setDisplayedLines([]);
    setCurrentLine(0);
    setCurrentChar(0);
    setIsTyping(true);
  }, [step]);

  // Typing effect
  useEffect(() => {
    if (currentLine >= messages.length) {
      setIsTyping(false);
      return;
    }

    const line = messages[currentLine];
    if (currentChar < line.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const copy = [...prev];
          copy[currentLine] = line.slice(0, currentChar + 1);
          return copy;
        });
        setCurrentChar((c) => c + 1);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentLine, currentChar, messages]);

  return (
    <div className="cyber-card glow-purple p-4 relative">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded bg-[var(--neon-purple)] flex items-center justify-center text-black font-bold text-xs font-mono-data">
          A0
        </div>
        <span className="font-mono-data text-xs text-[var(--neon-purple)] font-bold tracking-wider">
          AGENT_ZERO
        </span>
        {isTyping && (
          <span className="ml-auto font-mono-data text-[10px] text-[var(--neon-purple)] animate-pulse">
            typing...
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-1.5 min-h-[60px]">
        {displayedLines.map((line, i) => (
          <p key={`${step}-${i}`} className="font-mono-data text-sm text-gray-300 leading-relaxed">
            <span className="text-[var(--neon-purple)] opacity-60 mr-1.5">{">"}</span>
            {line}
          </p>
        ))}
        {isTyping && displayedLines.length === 0 && (
          <span className="inline-block w-2 h-4 bg-[var(--neon-purple)] animate-pulse" />
        )}
      </div>
    </div>
  );
}

/* ─── Step Indicator ─── */

interface StepDef {
  id: number;
  label: string;
  tag: string;
  color: string;
}

const STEPS: StepDef[] = [
  { id: 0, label: "Briefing", tag: "BRIEF", color: "var(--neon-purple)" },
  { id: 1, label: "Kimlik", tag: "AUTH", color: "var(--neon-blue)" },
  { id: 2, label: "İsim", tag: "NAME", color: "var(--neon-pink)" },
  { id: 3, label: "Enerji", tag: "FUEL", color: "var(--neon-yellow)" },
  { id: 4, label: "Transfer", tag: "TX", color: "var(--neon-green)" },
];

function StepBar({ current, unlocked }: { current: number; unlocked: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const isActive = i === current;
        const isUnlocked = i <= unlocked;
        const isDone = i < current;

        return (
          <div key={s.id} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className="w-6 h-px"
                style={{
                  background: isDone ? s.color : "rgba(255,255,255,0.1)",
                }}
              />
            )}
            <div
              className="font-mono-data text-[10px] px-2 py-1 border transition-all duration-300"
              style={{
                borderColor: isActive ? s.color : isUnlocked ? `${s.color}44` : "rgba(255,255,255,0.1)",
                color: isActive ? s.color : isUnlocked ? `${s.color}99` : "rgba(255,255,255,0.2)",
                background: isActive ? `${s.color}11` : "transparent",
                boxShadow: isActive ? `0 0 10px ${s.color}22` : "none",
              }}
            >
              {isDone ? "✓" : isUnlocked ? s.tag : "🔒"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Achievement Toast ─── */

function AchievementToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.4s_ease-out]">
      <div className="cyber-card glow-green px-6 py-3 flex items-center gap-3">
        <span className="text-[var(--neon-green)] text-lg">⚡</span>
        <div>
          <p className="font-mono-data text-[10px] text-[var(--neon-green)] tracking-wider">ACHIEVEMENT_UNLOCKED</p>
          <p className="font-mono-data text-sm text-white font-bold">{message}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Locked Card Overlay ─── */

function LockedCard({ label, stepTag }: { label: string; stepTag: string }) {
  return (
    <div className="cyber-card p-5 relative overflow-hidden opacity-40 cursor-not-allowed">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]" />
      <div className="flex items-center justify-center gap-3 py-6">
        <span className="text-2xl opacity-50">🔒</span>
        <div>
          <p className="font-mono-data text-sm text-gray-500">{label}</p>
          <p className="font-mono-data text-[10px] text-gray-700">
            Önceki adımı tamamla → {stepTag}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Briefing Slide Show ─── */

interface SlideData {
  tag: string;
  title: string;
  color: string;
  ascii: string;
  stat: string;
  statSource: string;
  description: string;
  highlight: string;
}

const SLIDES: SlideData[] = [
  {
    tag: "01",
    title: "DİJİTAL EGEMENLİK",
    color: "var(--neon-green)",
    ascii: `
    ┌─────────────┐
    │  ◈ KEY ◈    │
    │  ┌───────┐  │
    │  │ ▓▓▓▓▓ │  │
    │  │ ▓ ◆ ▓ │  │
    │  │ ▓▓▓▓▓ │  │
    │  └───┬───┘  │
    │      │      │
    │   ╔══╧══╗   │
    │   ║OWNER║   │
    │   ╚═════╝   │
    └─────────────┘`,
    stat: "1.7 milyar",
    statSource: "insan banka hesabına sahip değil — ama blockchain ile herkes kendi bankası olabilir",
    description: "Bu cüzdan sadece para tutmaz —",
    highlight: "dijital dünyadaki bağımsızlık ilanın. Anahtarlar sende olduğu sürece kimsenin \"kapat\" düğmesi yok.",
  },
  {
    tag: "02",
    title: "DÜNYA BİLGİSAYARI",
    color: "var(--neon-blue)",
    ascii: `
        ╭──●──╮
      ╭─┤     ├─╮
    ●─┤  ╰──●──╯  ├─●
      │   ╭─┤      │
    ●─┤  ●  ├─●   ├─●
      │   ╰─┤      │
    ●─┤  ╭──●──╮  ├─●
      ╰─┤     ├─╯
        ╰──●──╯
     [ NODES: 11,000+ ]`,
    stat: "%99.99 uptime",
    statSource: "Ethereum 2015'ten beri durdurulamaz çalışıyor — fişi çekilemeyen tek bilgisayar",
    description: "Binlerce bilgisayarın aynı anda çalıştığı devasa bir ağ.",
    highlight: "Patronu yok, kuralları kodla yazılmış, matematik tarafından korunuyor.",
  },
  {
    tag: "03",
    title: "AI AJANLARIN YAKITI",
    color: "var(--neon-purple)",
    ascii: `
    ┌──────────────┐
    │  ◉  AGENT  ◉ │
    │  ┌──────────┐ │
    │  │ ░░▓▓▓░░  │ │
    │  │ ░▓◈◈▓░  │ │
    │  │ ░░▓▓▓░░  │ │
    │  └────┬─────┘ │
    │    ┌──┴──┐    │
    │    │WALLET│    │
    │    │ ⚡⚡⚡ │    │
    │    └──────┘    │
    └──────────────┘`,
    stat: "%50 internet trafiği",
    statSource: "2030'da yapay zeka ajanları tarafından yönetilecek — ve onların da cüzdana ihtiyacı var",
    description: "Gelecekte AI ajanlar senin adına çalışacak —",
    highlight: "maaşlarını bu cüzdana alacaklar. Cüzdanın, dijital asistanlarının dünyayla iletişim kurduğu enerji girişi.",
  },
  {
    tag: "04",
    title: "KOPYALANAMAYAN DNA",
    color: "var(--neon-pink)",
    ascii: `
     Ctrl+C ?  ╳ DENIED
    ┌──────────────┐
    │  ◆ NFT #001  │
    │  ╔══════════╗ │
    │  ║  ▓▓▓▓▓▓  ║ │
    │  ║  ▓☆▓▓☆▓  ║ │
    │  ║  ▓▓▓▓▓▓  ║ │
    │  ╚══════════╝ │
    │  UNIQUE: ✓    │
    │  OWNER: SEN   │
    └──────────────┘`,
    stat: "Tek ve biricik",
    statSource: "İnternette her şey kopyalanır — ama blockchain'de bir şeyden sadece BİR tane olabilir",
    description: "Oyundaki kılıcın, avatarın, sanat eserin —",
    highlight: "oyun kapansa bile cüzdanında yaşamaya devam eder. Dijital dünyada gerçek sahiplik.",
  },
  {
    tag: "05",
    title: "DON'T TRUST — VERIFY",
    color: "var(--neon-yellow)",
    ascii: `
    ╔═══════════════╗
    ║  TRUST: ✗     ║
    ║  VERIFY: ✓    ║
    ╠═══════════════╣
    ║ sha256(block)  ║
    ║ = a4f8e2...    ║
    ║                ║
    ║ VALID ◈ TRUE   ║
    ║ TAMPER ◈ FALSE ║
    ╚═══════════════╝
    [ MATH > PROMISE ]`,
    stat: "256-bit şifreleme",
    statSource: "İşlemler söz ile değil, kırılamaz matematiksel algoritmalarla onaylanır",
    description: "Kimseye \"söz verdiği için\" güvenmek zorunda değilsin —",
    highlight: "kod ne yazıyorsa o gerçekleşir. Herkesin görebildiği ama kimsenin hile yapamadığı bir oyun alanı.",
  },
  {
    tag: "06",
    title: "COĞRAFYASIZ EKONOMİ",
    color: "var(--neon-blue)",
    ascii: `
      ╭─── IST ───╮
      │            │
    ──●    ⚡⚡⚡    ●──
      │   <1 sn   │
      │            │
    ──●    ⚡⚡⚡    ●──
      │            │
      ╰─── NYC ───╯
     [ NO BORDERS ]
     [ NO BANKS   ]`,
    stat: "< 1 saniye",
    statSource: "Sınır ötesi transferler bankalarda 3 gün sürer — blockchain'de saniyeler içinde",
    description: "Dünyanın öbür ucundaki biriyle anında takas yap.",
    highlight: "Sınır yok, pasaport yok, banka yok. Sen artık küresel bir ağın bağımsız düğümüsün.",
  },
];

function BriefingSlides({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  function goTo(index: number) {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 200);
  }

  function next() {
    if (isLast) {
      onComplete();
    } else {
      goTo(current + 1);
    }
  }

  function prev() {
    if (current > 0) goTo(current - 1);
  }

  return (
    <div
      className="cyber-card p-5 space-y-4 transition-all duration-300"
      style={{
        borderColor: `color-mix(in srgb, ${slide.color} 30%, transparent)`,
        boxShadow: `0 0 20px color-mix(in srgb, ${slide.color} 10%, transparent), inset 0 0 20px color-mix(in srgb, ${slide.color} 3%, transparent)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: slide.color }}
          />
          <span
            className="font-mono-data text-xs font-bold tracking-wider"
            style={{ color: slide.color }}
          >
            [{slide.tag}] {slide.title}
          </span>
        </div>
        <span className="font-mono-data text-[10px] text-gray-600">
          {current + 1}/{SLIDES.length}
        </span>
      </div>

      {/* Content */}
      <div
        className={`transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}
      >
        {/* ASCII Art */}
        <div className="flex justify-center mb-4">
          <pre
            className="font-mono-data text-[11px] leading-tight select-none"
            style={{ color: slide.color, opacity: 0.7 }}
          >
            {slide.ascii}
          </pre>
        </div>

        {/* Stat callout */}
        <div
          className="text-center mb-4 py-3 border-y"
          style={{ borderColor: `color-mix(in srgb, ${slide.color} 20%, transparent)` }}
        >
          <p
            className="font-mono-data text-2xl font-bold tracking-wider"
            style={{ color: slide.color }}
          >
            {slide.stat}
          </p>
          <p className="font-mono-data text-xs text-gray-500 mt-1">
            {slide.statSource}
          </p>
        </div>

        {/* Description */}
        <p className="font-mono-data text-sm text-gray-400 text-center leading-relaxed">
          {slide.description}{" "}
          <span className="text-white font-medium">{slide.highlight}</span>
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={prev}
          disabled={current === 0}
          className="font-mono-data text-xs px-3 py-1.5 border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          {"<"} GERİ
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                width: i === current ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  i === current
                    ? slide.color
                    : i < current
                      ? `color-mix(in srgb, ${SLIDES[i].color} 40%, transparent)`
                      : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="font-mono-data text-xs px-3 py-1.5 transition-all"
          style={{
            background: isLast ? slide.color : "transparent",
            color: isLast ? "black" : slide.color,
            border: isLast ? "none" : `1px solid color-mix(in srgb, ${slide.color} 40%, transparent)`,
            fontWeight: isLast ? 700 : 400,
          }}
        >
          {isLast ? "> BAŞLAYALIM!" : "İLERİ >"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

/* ─── Cyberpunk Name Suggestions ─── */

const CYBER_ADJECTIVES = [
  "neon", "cyber", "shadow", "glitch", "pixel", "void", "quantum", "dark",
  "flux", "zero", "nova", "pulse", "byte", "vortex", "ghost", "storm",
];
const CYBER_NOUNS = [
  "wolf", "hawk", "blade", "spark", "node", "core", "fox", "lynx",
  "bolt", "sage", "wraith", "echo", "drift", "crypt", "hex", "rune",
];

function generateSuggestions(count = 4): string[] {
  const results: string[] = [];
  const used = new Set<string>();
  while (results.length < count) {
    const adj = CYBER_ADJECTIVES[Math.floor(Math.random() * CYBER_ADJECTIVES.length)];
    const noun = CYBER_NOUNS[Math.floor(Math.random() * CYBER_NOUNS.length)];
    const name = `${adj}_${noun}`;
    if (!used.has(name)) {
      used.add(name);
      results.push(name);
    }
  }
  return results;
}

/* ─── Main Component ─── */

export default function WalletModule() {
  const account = useActiveAccount();
  const { data: balance, isLoading: balanceLoading } = useWalletBalance({
    client,
    chain,
    address: account?.address,
  });

  const [walletCompleted, setWalletCompleted] = useState(() => localStorage.getItem("arena_wallet_done") === "1");
  const [step, setStep] = useState(0);
  const [unlockedStep, setUnlockedStep] = useState(0);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState("");
  const [faucetUsed, setFaucetUsed] = useState(false);
  const [transferDone, setTransferDone] = useState(false);
  const [achievement, setAchievement] = useState<string | null>(null);

  // Arena Name state
  const [arenaName, setArenaName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [suggestions] = useState(() => generateSuggestions(4));

  const showAchievement = useCallback((msg: string) => {
    setAchievement(msg);
  }, []);

  const hasBalance = Number(balance?.displayValue || 0) > 0;

  // Check if user already has a name — skip name step if so
  useEffect(() => {
    if (account && !arenaName) {
      resolveAddressToName(account.address).then((name) => {
        if (name) {
          setArenaName(name);
          // Already has name → skip name step, unlock up to faucet
          setUnlockedStep((prev) => Math.max(prev, 3));
          setStep((prev) => (prev <= 2 ? 3 : prev));
        }
      });
    }
  }, [account, arenaName]);

  // Auto-advance: wallet connected → step 2 (name)
  useEffect(() => {
    if (account && step === 1) {
      showAchievement("Dijital Kimlik Oluşturuldu!");
      setTimeout(() => {
        setStep(2);
        setUnlockedStep((prev) => Math.max(prev, 2));
      }, 800);
      postActivity({
        type: "wallet_created",
        address: account.address,
        data: {},
      });
    }
  }, [account, step, showAchievement]);

  // Auto-unlock step 4 (transfer) if wallet already has balance
  useEffect(() => {
    if (hasBalance && step === 3 && !faucetUsed) {
      setFaucetUsed(true);
      setUnlockedStep((prev) => Math.max(prev, 4));
    }
  }, [hasBalance, step, faucetUsed]);

  async function handleRegisterName(name: string) {
    if (!account) return;
    const clean = name.toLowerCase().replace(/\.arena$/, "").trim();
    if (!/^[a-z0-9_]{3,16}$/.test(clean)) {
      setNameError("3-16 karakter, harf/rakam/alt çizgi");
      return;
    }
    setNameLoading(true);
    setNameError("");
    try {
      const res = await registerName(account.address, clean);
      if (res.ok) {
        setArenaName(clean);
        setStep(3);
        setUnlockedStep((prev) => Math.max(prev, 3));
        showAchievement(`${clean}.arena — İsmin Kayıt Edildi!`);
      } else {
        setNameError(res.error || "Bir hata oluştu");
      }
    } catch {
      setNameError("Bağlantı hatası");
    } finally {
      setNameLoading(false);
    }
  }

  async function handleFaucet() {
    if (!account) return;
    setFaucetLoading(true);
    setFaucetMsg("");
    try {
      const res = await requestFaucet(account.address);
      if (res.txHash) {
        setFaucetMsg("Test AVAX gönderildi!");
        setFaucetUsed(true);
        setUnlockedStep((prev) => Math.max(prev, 4));
        showAchievement("Test AVAX Alındı — Enerji Yüklendi!");
        await postActivity({
          type: "faucet",
          address: account.address,
          data: { txHash: res.txHash },
        });
      } else {
        setFaucetMsg(res.error || "Bir hata oluştu");
      }
    } catch {
      setFaucetMsg("Bağlantı hatası");
    } finally {
      setFaucetLoading(false);
    }
  }

  function handleTransferSuccess() {
    if (!transferDone) {
      setTransferDone(true);
      setWalletCompleted(true);
      localStorage.setItem("arena_wallet_done", "1");
      showAchievement("İlk Transfer Tamamlandı!");
    }
  }

  // ─── Completed: Direct wallet view ───
  if (walletCompleted && account) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        {achievement && (
          <AchievementToast message={achievement} onDone={() => setAchievement(null)} />
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[var(--neon-blue)]" />
          <h1 className="font-mono-data text-xl font-bold text-[var(--neon-blue)] tracking-wider">
            WALLET_MODULE
          </h1>
        </div>

        {/* Identity */}
        <div className="cyber-card glow-blue p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)]" />
            <h2 className="font-mono-data text-sm font-bold text-[var(--neon-green)] tracking-wider">
              IDENTITY_ACTIVE
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {arenaName ? (
              <code className="font-mono-data text-base text-[var(--neon-pink)] font-bold">
                {arenaName}.arena
              </code>
            ) : (
              <code className="font-mono-data text-base text-[var(--neon-blue)]">
                {shortenAddress(account.address)}
              </code>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(account.address)}
              className="font-mono-data text-[10px] text-gray-500 border border-gray-800 px-2 py-0.5 hover:text-[var(--neon-green)] hover:border-[var(--border-glow)] transition-colors"
            >
              COPY
            </button>
            <a
              href={`${EXPLORER_ADDRESS_URL}${account.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono-data text-[10px] text-gray-500 hover:text-[var(--neon-blue)] transition-colors"
            >
              SCAN
            </a>
            {arenaName && (
              <span className="ml-auto font-mono-data text-[10px] text-gray-600">
                {shortenAddress(account.address)}
              </span>
            )}
          </div>
        </div>

        {/* Balance + Faucet */}
        <div className="cyber-card glow-yellow p-5 space-y-4">
          <div>
            <p className="font-mono-data text-[10px] text-gray-600 mb-1">BALANCE</p>
            <p className="font-mono-data text-3xl font-bold text-white">
              {balanceLoading ? "..." : Number(balance?.displayValue || 0).toFixed(4)}
              <span className="text-sm text-gray-500 ml-2">AVAX</span>
            </p>
          </div>
          <button
            onClick={handleFaucet}
            disabled={faucetLoading}
            className="cyber-btn w-full bg-[var(--neon-yellow)] px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(255,225,86,0.3)] disabled:opacity-50"
          >
            {faucetLoading ? "SENDING..." : "> REQUEST_TEST_ETH"}
          </button>
          {faucetMsg && (
            <p className="font-mono-data text-xs text-center text-[var(--neon-green)]">{faucetMsg}</p>
          )}
        </div>

        {/* Transfer */}
        <TransferForm senderAddress={account.address} />
      </div>
    );
  }

  // ─── Tutorial flow ───
  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* Achievement Toast */}
      {achievement && (
        <AchievementToast message={achievement} onDone={() => setAchievement(null)} />
      )}

      {/* Header + Step Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[var(--neon-blue)]" />
          <h1 className="font-mono-data text-xl font-bold text-[var(--neon-blue)] tracking-wider">
            WALLET_MODULE
          </h1>
        </div>
        <StepBar current={step} unlocked={unlockedStep} />
      </div>

      {/* Agent-Zero Mentor */}
      <AgentZero step={step} hasBalance={hasBalance} arenaName={arenaName} />

      {/* ═══ STEP 0: Briefing Slide Show ═══ */}
      {step === 0 && <BriefingSlides onComplete={() => { setStep(1); setUnlockedStep(1); }} />}

      {/* ═══ STEP 1: Connect Wallet ═══ */}
      {step >= 1 && !account && (
        <div className="cyber-card glow-blue p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-blue)] animate-pulse" />
            <h2 className="font-mono-data text-sm font-bold text-[var(--neon-blue)] tracking-wider">
              STEP_01 — DİJİTAL KİMLİK
            </h2>
          </div>
          <p className="font-mono-data text-xs text-gray-500">
            Email veya Google ile giriş yap. Otomatik olarak blockchain cüzdanın oluşacak.
          </p>
          <ConnectButton
            client={client}
            wallets={wallets}
            chain={chain}
            connectButton={{ label: "> CREATE_IDENTITY" }}
          />
        </div>
      )}

      {/* Connected wallet info (always visible once connected) */}
      {account && step >= 1 && (
        <div className="cyber-card glow-blue p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)]" />
            <h2 className="font-mono-data text-sm font-bold text-[var(--neon-green)] tracking-wider">
              IDENTITY_ACTIVE
            </h2>
            <span className="ml-auto font-mono-data text-[10px] text-[var(--neon-green)] opacity-60">
              ✓ CONNECTED
            </span>
          </div>
          <div className="flex items-center gap-2">
            {arenaName ? (
              <code className="font-mono-data text-base text-[var(--neon-pink)] font-bold">
                {arenaName}.arena
              </code>
            ) : (
              <code className="font-mono-data text-base text-[var(--neon-blue)]">
                {shortenAddress(account.address)}
              </code>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(account.address)}
              className="font-mono-data text-[10px] text-gray-500 border border-gray-800 px-2 py-0.5 hover:text-[var(--neon-green)] hover:border-[var(--border-glow)] transition-colors"
            >
              COPY
            </button>
            <a
              href={`${EXPLORER_ADDRESS_URL}${account.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono-data text-[10px] text-gray-500 hover:text-[var(--neon-blue)] transition-colors"
            >
              SCAN
            </a>
            {arenaName && (
              <span className="ml-auto font-mono-data text-[10px] text-gray-600">
                {shortenAddress(account.address)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Arena Name ═══ */}
      {step === 2 && account && !arenaName ? (
        <div className="cyber-card glow-pink p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-pink)] animate-pulse" />
            <h2 className="font-mono-data text-sm font-bold text-[var(--neon-pink)] tracking-wider">
              STEP_02 — ARENA İSMİN
            </h2>
          </div>

          <p className="font-mono-data text-xs text-gray-500">
            0x adresleri karışık. Kendine bir .arena ismi seç — arkadaşların seni bununla bulacak.
          </p>

          {/* Suggestions */}
          <div>
            <p className="font-mono-data text-[10px] text-gray-600 mb-2">NEURAL_GENERATOR</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setNameInput(s)}
                  className={`font-mono-data text-xs px-3 py-2 border transition-all text-left ${
                    nameInput === s
                      ? "border-[var(--neon-pink)] text-[var(--neon-pink)] bg-[rgba(255,45,124,0.05)]"
                      : "border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                  }`}
                >
                  {s}<span className="text-gray-600">.arena</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div>
            <p className="font-mono-data text-[10px] text-gray-600 mb-1">CUSTOM_NAME</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                    setNameError("");
                  }}
                  placeholder="senin_ismin"
                  maxLength={16}
                  className="cyber-input w-full px-3 py-2.5 text-white font-mono-data text-sm pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-data text-xs text-gray-600">
                  .arena
                </span>
              </div>
            </div>
            {nameError && (
              <p className="font-mono-data text-xs text-[var(--neon-pink)] mt-1">{nameError}</p>
            )}
          </div>

          <button
            onClick={() => handleRegisterName(nameInput)}
            disabled={nameLoading || !nameInput}
            className="cyber-btn w-full bg-[var(--neon-pink)] px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(255,45,124,0.3)] disabled:opacity-50"
          >
            {nameLoading ? "REGISTERING..." : `> CLAIM ${nameInput || "..."}.arena`}
          </button>
        </div>
      ) : (
        step < 2 && step >= 1 && <LockedCard label="Arena İsmini Seç" stepTag="Önce kimliğini oluştur" />
      )}

      {/* ═══ STEP 3: Energy (Faucet) ═══ */}
      {step >= 3 && account ? (
        <div className="cyber-card glow-yellow p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-yellow)]" />
            <h2 className="font-mono-data text-sm font-bold text-[var(--neon-yellow)] tracking-wider">
              STEP_03 — ENERJİ YÜKLE
            </h2>
            {faucetUsed && (
              <span className="ml-auto font-mono-data text-[10px] text-[var(--neon-green)] opacity-60">
                ✓ LOADED
              </span>
            )}
          </div>

          <div>
            <p className="font-mono-data text-[10px] text-gray-600 mb-1">BALANCE</p>
            <p className="font-mono-data text-3xl font-bold text-white">
              {balanceLoading
                ? "..."
                : Number(balance?.displayValue || 0).toFixed(4)}
              <span className="text-sm text-gray-500 ml-2">AVAX</span>
            </p>
          </div>

          {!hasBalance && !faucetUsed && (
            <p className="font-mono-data text-xs text-gray-500">
              Cüzdanın boş — test AVAX al. Bu gerçek para değil, workshop için kullanıyoruz.
            </p>
          )}

          <button
            onClick={handleFaucet}
            disabled={faucetLoading}
            className="cyber-btn w-full bg-[var(--neon-yellow)] px-4 py-3 font-mono-data text-sm font-bold text-black hover:shadow-[0_0_20px_rgba(255,225,86,0.3)] disabled:opacity-50"
          >
            {faucetLoading ? "SENDING..." : "> REQUEST_TEST_ETH"}
          </button>
          {faucetMsg && (
            <p className="font-mono-data text-xs text-center text-[var(--neon-green)]">{faucetMsg}</p>
          )}

          {faucetUsed && step === 3 && (
            <button
              onClick={() => setStep(4)}
              className="cyber-btn w-full border border-[var(--neon-green)] bg-transparent px-4 py-2 font-mono-data text-xs text-[var(--neon-green)] hover:bg-[rgba(0,255,170,0.05)]"
            >
              {">"} SONRAKI ADIM: TRANSFER
            </button>
          )}
        </div>
      ) : (
        step < 3 &&
        step >= 2 && <LockedCard label="Enerji Yükle" stepTag="Önce ismini seç" />
      )}

      {/* ═══ STEP 4: Transfer ═══ */}
      {step >= 4 && account ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-1 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)]" />
            <h2 className="font-mono-data text-sm font-bold text-[var(--neon-green)] tracking-wider">
              STEP_04 — TRANSFER
            </h2>
            {transferDone && (
              <span className="ml-auto font-mono-data text-[10px] text-[var(--neon-green)] opacity-60">
                ✓ SENT
              </span>
            )}
          </div>
          {!transferDone && (
            <p className="font-mono-data text-xs text-gray-500 px-1 mb-2">
              Arkadaşının .arena ismini veya 0x adresini gir, AVAX gönder. Aracı yok!
            </p>
          )}
          <TransferForm senderAddress={account.address} onSuccess={handleTransferSuccess} />
        </div>
      ) : (
        step < 4 &&
        step >= 3 && <LockedCard label="Transfer Gönder" stepTag="Önce test AVAX al" />
      )}

    </div>
  );
}
