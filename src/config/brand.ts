// ─── Modular Brand Config ─────────────────────────────────────────────
// Tek dosyayı değiştirerek tüm siteyi yeni bir brand'e geçirebilirsin.

export interface BrandConfig {
  // İsim & Metin
  name: string;
  networkName: string;
  networkShort: string;
  tokenSymbol: string;
  tokenName: string;
  explorerName: string;

  // Renkler
  brandColor: string;
  brandColorRgb: string;

  // URL'ler
  explorerTxUrl: string;
  explorerAddressUrl: string;
  rpcUrl: string;

  // Chain
  chainId: number;

  // Logo — inline SVG path data (küçük ikon için)
  logoSvgPath: string;
  logoSvgViewBox: string;

  // Logo — dosya yolu (büyük logo için)
  logoUrl: string;

  // "Powered by X" metni
  poweredByText: string;
}

// ─── Avalanche Fuji Testnet (varsayılan) ──────────────────────────────

export const brand: BrandConfig = {
  name: "Avalanche",
  networkName: "Avalanche Fuji",
  networkShort: "FUJI",
  tokenSymbol: "AVAX",
  tokenName: "AVAX",
  explorerName: "Snowtrace",

  brandColor: "#E84142",
  brandColorRgb: "232, 65, 66",

  explorerTxUrl: "https://testnet.snowtrace.io/tx/",
  explorerAddressUrl: "https://testnet.snowtrace.io/address/",
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",

  chainId: 43113,

  logoSvgPath: "M12 2L2 22h20L12 2z",
  logoSvgViewBox: "0 0 24 24",

  logoUrl: "/brand/avalanche-logo.svg",

  poweredByText: "POWERED BY AVALANCHE",
};

// ─── CSS Custom Properties Injection ──────────────────────────────────

export function injectBrandCSS() {
  document.documentElement.style.setProperty("--brand-color", brand.brandColor);
  document.documentElement.style.setProperty("--brand-color-rgb", brand.brandColorRgb);
}
