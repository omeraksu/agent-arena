// Avalanche Fuji Testnet
export const CHAIN_ID = 43113;
export const RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";
export const EXPLORER_TX_URL = "https://testnet.snowtrace.io/tx/";
export const EXPLORER_ADDRESS_URL = "https://testnet.snowtrace.io/address/";
export const NETWORK_NAME = "Avalanche Fuji";

export const POLL_INTERVAL = 5000;
export const SESSION_RESET_POLL_INTERVAL = 10000;
export const SQUAD_POLL_INTERVAL = 10000;
export const NAMES_POLL_INTERVAL = 30000;
export const RATE_LIMIT_PER_SESSION = 30;
export const MAX_FAUCET_REQUESTS = 3;
export const DEFAULT_TRANSFER_AMOUNT = "0.001";
export const FAUCET_AMOUNT = "0.005";

// ─── Squad Milestones ───
export const XP_VALUES: Record<string, number> = {
  wallet_created: 10,
  faucet: 20,
  transfer: 30,
  nft_mint: 200,
  agent_registered: 25,
  quiz_completed: 100,
  meme_submitted: 50,
  meme_voted: 10,
  signal_pulse: 5,
  meme_winner: 300,
};

// ─── Signal Pulse Milestones ───
export const SIGNAL_MILESTONES = [
  { threshold: 100, title: "Sistem Uyaniyor", emoji: "⚡" },
  { threshold: 300, title: "Ag Aktif", emoji: "🔗" },
  { threshold: 500, title: "Mainframe Kirildi!", emoji: "🏆" },
];

export const SQUAD_MILESTONES = [
  { xp: 300, title: "Ilk Kivilcim", msg: "Sinif ilk adimi atti! Zincir uyaniyor.", emoji: "⚡" },
  { xp: 1500, title: "Zincir Uyaniyor", msg: "Bloklar birbirini takip ediyor! Momentum kazandiniz.", emoji: "🔗" },
  { xp: 4000, title: "Ag Kuruldu", msg: "Sinif olarak bir ag olusturdunuz. Bu blockchain.", emoji: "🌐" },
  { xp: 7500, title: "Arena Efsanesi", msg: "Workshop rekoru! Bu sinif tarihe gecti.", emoji: "🏆" },
];

// ─── Post-Mint Quiz ───
export const POST_MINT_QUIZ = [
  {
    question: "NFT'ni az once kim dogruladi?",
    options: ["Sen kendin", "Blockchain agi (madenciler/dogrulayicilar)", "Arena agent'i", "Ogretmen"],
    correctIndex: 1,
    explanation: "NFT mint islemi blockchain agindaki dogrulayicilar tarafindan onaylandi. Kimseye guvenmen gerekmedi!",
  },
  {
    question: "Bu NFT neden geri alinamaz?",
    options: ["Cunku sifre koyduk", "Cunku server'da kilitli", "Blockchain'e yazilan veri degistirilemez (immutable)", "Cunku internet kesilirse kaybolur"],
    correctIndex: 2,
    explanation: "Blockchain'e yazilan veriler degistirilemez. NFT'n sonsuza kadar senin — kimse silemez veya degistiremez.",
  },
  {
    question: "Islem icin odedigin gas ucreti nereye gitti?",
    options: ["Arena'ya", "Ogretmene", "Ag dogrulayicilarina (validators)", "Kimseye — ucretsizdi"],
    correctIndex: 2,
    explanation: "Gas ucretleri agi guvenli tutan dogrulayicilara odenir. Bu workshop'ta biz senin yerine odedik (gasless tx)!",
  },
];

// ─── Signal Pulse Rounds ───
export const SIGNAL_COUNTDOWN_MS = 5000;
export const SIGNAL_ROUND_DURATION_MS = 30000;
export const SIGNAL_ROUND_RATE_LIMIT_MS = 1000;

// ─── Energy System ───
export const ENERGY_MAX = 1000;
export const ENERGY_QUIZ_BONUS = 50;
