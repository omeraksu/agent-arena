# ARIA Hub — Blockchain & Wallet Entegrasyonu

## Ag Bilgileri

| Ozellik | Deger |
|---|---|
| Ag | Avalanche Fuji Testnet |
| Chain ID | `43113` |
| RPC URL | `https://api.avax-test.network/ext/bc/C/rpc` |
| Token | AVAX (test) |
| Explorer | Snowtrace (`https://testnet.snowtrace.io`) |
| TX URL pattern | `https://testnet.snowtrace.io/tx/<hash>` |
| Address URL pattern | `https://testnet.snowtrace.io/address/<address>` |

## thirdweb Entegrasyonu

### Yapilandirma

**Dosya:** `src/lib/thirdweb.ts`

```typescript
import { createThirdwebClient, defineChain } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "demo-client-id",
});

export const chain = defineChain(43113); // Avalanche Fuji

export const wallets = [
  inAppWallet({
    auth: { options: ["email", "google"] },
    smartAccount: {
      chain,
      sponsorGas: true,  // Tum gas ucretleri sponsor edilir
    },
  }),
];
```

- **SDK:** thirdweb v5 (`thirdweb@^5.92.0`)
- **Wallet tipi:** In-App Wallet + Account Abstraction (Smart Account)
- **Auth:** Email veya Google login
- **Gasless:** `sponsorGas: true` — Paymaster tum gas'i karsilar

### Wallet Olusturma Akisi

```
Kullanici "Basla" tiklar
    │
    ▼
ConnectButton (thirdweb)
    │
    ├── Email girisi → OTP dogrulama
    │   VEYA
    └── Google OAuth popup
    │
    ▼
thirdweb embedded EOA olusturur (gizli, kullanici gormez)
    │
    ▼
Smart Account (Account Abstraction) wrap eder
    │  - Gasless TX destegi
    │  - EIP-4337 UserOperation
    │
    ▼
Kullanici cuzdana sahip (0x adresi gorunur)
    │
    ▼
wallet_created activity event → Canli Feed
```

**Onemli:** Kullanici hicbir zaman seed phrase gormez, gas odemez veya browser extension kurmaz.

## Wallet Module — 5 Adimli Onboarding

**Dosya:** `src/components/WalletModule.tsx`

| Adim | Tag | Icerik | Tamamlaninca |
|---|---|---|---|
| 0 | BRIEF | 6 slaytlik blockchain konsept sunumu | → 1 |
| 1 | AUTH | thirdweb `ConnectButton` — email/Google login | `wallet_created` event, → 2 |
| 2 | NAME | `.arena` isim talebi (3-16 char, `[a-z0-9_]`) | `POST /api/names`, → 3 |
| 3 | FUEL | Faucet — 0.005 test AVAX al | `POST /api/faucet`, `localStorage: arena_faucet_used`, → 4 |
| 4 | TX | Arkadasa AVAX gonder (`TransferForm`) | `localStorage: arena_wallet_done` |

Her adimda `AgentZero` mentor komponenti baglamsal yazili mesajlar gosterir. `StepBar` neon renkli ilerleme cubugu goruntüler.

## Smart Contract: WorkshopNFT

**Dosya:** `contracts/WorkshopNFT.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WorkshopNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    constructor(string memory baseURI)
        ERC721("ARIA Hub Workshop", "ARENA")
        Ownable(msg.sender)
    {
        _baseTokenURI = baseURI;
    }

    function mintTo(address to) external onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
```

| Ozellik | Deger |
|---|---|
| Token ismi | ARIA Hub Workshop |
| Token sembol | ARENA |
| Standart | ERC-721 |
| OpenZeppelin | v5.6.1 |
| Solidity | 0.8.28 |
| EVM | Cancun |
| `mintTo` | `onlyOwner` — sadece backend wallet mint yapabilir |
| Token ID | Sequential (`_nextTokenId++`) |
| Metadata | `_baseTokenURI` + tokenId → `GET /api/metadata/<tokenId>` |

## Deploy

### Hardhat Yapilandirmasi

**Dosya:** `hardhat.config.cts`

```typescript
// Networks
sepolia: { url: "https://ethereum-sepolia-rpc.publicnode.com", accounts: [SEPOLIA_PRIVATE_KEY] }
fuji:    { url: "https://api.avax-test.network/ext/bc/C/rpc", accounts: [FUJI_PRIVATE_KEY] }
```

### Deploy Komutlari

```bash
# Contract derle
npm run compile

# Fuji'ye deploy et
npm run deploy:fuji
# → Contract adresini konsola yazar
# → Bu adresi NFT_CONTRACT_ADDRESS env var olarak Vercel'e ekle

# BaseURI ayarla (deploy sonrasi)
npm run set-base-uri:fuji
# NFT_BASE_URI="https://agent-arena.vercel.app/api/metadata/" kullan

# Testleri calistir
npm run test:contracts
```

**Deploy script'i** (`scripts/deploy.cts`): `WorkshopNFT` contract'ini `NFT_BASE_URI` parametresiyle deploy eder.

**Set base URI script'i** (`scripts/set-base-uri.cts`): Daha once deploy edilmis contract'in `setBaseURI`'sini gunceller.

## Backend Wallet (viem)

**Dosya:** `api/_lib/viem.ts`

```typescript
// Read-only client (herkese acik)
export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
});

// Write client (faucet + mint icin)
export function getWalletClient(privateKey: string) {
  // 0x prefix temizleme, 32-byte hex dogrulama
  const account = privateKeyToAccount(key);
  return createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(RPC_URL),
  });
}
```

- `publicClient`: Bakiye sorgulama, `totalSupply` okuma
- `getWalletClient`: `FUJI_PRIVATE_KEY` ile faucet ve mint islemleri

**Onemli:** Backend `viem` kullanir (ethers degil). Frontend `thirdweb SDK` kullanir. Temiz ayrim.

## NFT Sistemi

### 7 Archetype SVG

**Dizin:** `public/nft/`

| Dosya | Archetype | Renk |
|---|---|---|
| `hacker.svg` | NEON HACKER | `--neon-green` |
| `sage.svg` | CYBER SAGE | `--neon-purple` |
| `pirate.svg` | DATA KORSAN | `--neon-yellow` |
| `scientist.svg` | LAB SCIENTIST | `--neon-blue` |
| `glitch.svg` | GLITCH AI | `--neon-pink` |
| `architect.svg` | CHAIN ARCHITECT | `--neon-orange` |
| `default.svg` | Fallback | — |

### NFT Metadata Yapisi

ERC-721 standart metadata (`GET /api/metadata/<tokenId>`):

```json
{
  "name": "CIPHER — Neon Hacker",
  "description": "ARIA Hub Workshop'ta olusturulmus dijital kimlik.",
  "image": "https://agent-arena.vercel.app/nft/hacker.svg",
  "attributes": [
    { "trait_type": "Workshop", "value": "ARIA Hub Workshop" },
    { "trait_type": "Date", "value": "2026-03-11" },
    { "trait_type": "Achievement", "value": "agent_convinced" },
    { "trait_type": "Archetype", "value": "hacker" },
    { "trait_type": "Agent Name", "value": "CIPHER" },
    { "trait_type": "Arena Name", "value": "kivanc.arena" },
    { "trait_type": "Level", "value": "3" },
    { "trait_type": "Special Trait", "value": "Kod Kirici" }
  ]
}
```

### Draft → Mint Akisi

```
1. Ogrenci agent chat'te "NFT istiyorum" der
   │
   ▼
2. Agent, quiz sorusu sorar (Pazarlici modu)
   │
   ▼
3. Ogrenci ikna ederse → draft_nft_metadata tool
   │  Supabase nft_metadata_drafts upsert
   │  (name, description, special_trait)
   │
   ▼
4. generate_nft_image tool (opsiyonel)
   │  POST /api/generate-image → Gemini API
   │  Gorsel → Supabase Storage (nft-images bucket)
   │  nft_metadata_drafts.image_url guncellenir
   │
   ▼
5. mint_nft tool
   │  Draft'tan metadata okur
   │  POST /api/mint
   │
   ├── Gercek mod (FUJI_PRIVATE_KEY + NFT_CONTRACT_ADDRESS var):
   │   │  publicClient.readContract(totalSupply) → tokenId
   │   │  walletClient.sendTransaction(mintTo) → txHash
   │   │  Supabase: nft_mints + nft_metadata insert
   │   └── Response: { txHash, tokenId, simulated: false }
   │
   └── Simulated mod (biri eksik):
       │  Sahte txHash olustur
       │  Sequential tokenId (nft_mints count'tan)
       │  Supabase: nft_mints (simulated: true) + nft_metadata
       └── Response: { txHash, tokenId, simulated: true }
   │
   ▼
6. Activity event: nft_mint → Canli Feed
   "X agent'i ikna edip NFT kazandi!"
```

### Gemini Gorsel Uretimi

**Dosya:** `api/generate-image.ts`

Iki mod destekler:

| Mod | Icerik |
|---|---|
| `generate` | Gemini `gemini-2.0-flash-exp` API ile text-to-image. Prompt Ingilizce olmali. |
| `upload` | Base64 gorseli dogrudan Supabase Storage'a yukle. Max 2 MB. |

Her iki modda da gorsel `nft-images/<address>/<timestamp>.<ext>` path'ine yuklenir ve `nft_metadata_drafts.image_url` guncellenir.

## Faucet Mekanizmasi

**Dosya:** `api/faucet.ts`

| Ozellik | Deger |
|---|---|
| Miktar | 0.005 AVAX |
| Limit | Adres basina 1 kullanim |
| Rate limit depo | Supabase `rate_limits` (key: `faucet:<address>`) |
| Fallback | `BoundedMap(200)` |
| Race condition | Sayac TX oncesi arttirilir, basarisizlikta geri alinir |

```
POST /api/faucet { address: "0x..." }
    │
    ├── Adres dogrulama (0x ile baslamali)
    ├── Rate limit kontrolu (max 1)
    ├── Sayaci arttir (once)
    ├── walletClient.sendTransaction({ to: address, value: parseEther("0.005") })
    │   ├── Basarili → { txHash }
    │   └── Basarisiz → sayaci geri al, 500 dondur
    └── 429: "Faucet hakkini zaten kullandin!"
```

## Gasless TX Mimarisi

```
Ogrenci (tarayici)
    │
    ▼
thirdweb Smart Account (AA)
    │
    ├── prepareTransaction({ to, value })
    ├── sendTransaction()  ← UserOperation olusturur
    │
    ▼
thirdweb Paymaster (Bundler)
    │
    ├── Gas ucretini karsilar
    ├── UserOperation'i paketler
    │
    ▼
Avalanche Fuji Testnet
    │
    └── TX onaylanir (ogrenci 0 gas odedi)
```

**Frontend'de transfer:**

```typescript
// src/components/TransferForm.tsx icinde
const tx = prepareTransaction({
  client,
  chain,
  to: recipientAddress,
  value: toWei(amount),
});
const result = await sendTransaction({ account, transaction: tx });
```

**Agent uzerinden transfer:**

`send_transfer` tool'u `transfer_intent` dondutur, frontend otomatik execute eder:

```typescript
// AgentChat.tsx icinde
if (toolResult.type === "transfer_intent") {
  const tx = prepareTransaction({ ... intent details });
  await sendTransaction({ account, transaction: tx });
  await postActivity({ type: "transfer", address, data: { ... } });
}
```

## Explorer Entegrasyonu

Snowtrace linkleri iki sekilde olusturulur:

1. **Backend:** `explore_tx` tool'u → `https://testnet.snowtrace.io/tx/<hash>`
2. **Frontend:** `brand.explorerTxUrl + hash` ve `brand.explorerAddressUrl + address`

**Brand config** (`src/config/brand.ts`):
```typescript
explorerTxUrl: "https://testnet.snowtrace.io/tx/"
explorerAddressUrl: "https://testnet.snowtrace.io/address/"
explorerName: "Snowtrace"
```

## Ortam Degiskenleri

### Frontend (Tarayicida gorunur — gizli bilgi KOYMMA)

| Degisken | Aciklama |
|---|---|
| `VITE_THIRDWEB_CLIENT_ID` | thirdweb dashboard'tan alinan public client ID |

Chain ID ve RPC URL `src/config/brand.ts` icinde hardcoded (43113, Fuji).

### Backend (Vercel gizli env vars)

| Degisken | Aciklama | Zorunlu mu |
|---|---|---|
| `FUJI_PRIVATE_KEY` | Faucet + mint wallet private key | Gercek on-chain icin evet |
| `NFT_CONTRACT_ADDRESS` | Deploy edilmis WorkshopNFT adresi | Gercek mint icin evet |
| `GEMINI_API_KEY` | Google Gemini API key | Gorsel uretim icin evet |
| `NFT_BASE_URI` | Contract deploy/update icin base URI | Deploy sirasinda |
| `ETHERSCAN_API_KEY` | Contract verification | Opsiyonel |

### Fallback Davranisi

| Durum | Sonuc |
|---|---|
| `FUJI_PRIVATE_KEY` yok | Faucet calismaz; mint simulated modda calisir |
| `NFT_CONTRACT_ADDRESS` yok | Mint simulated modda calisir |
| Her ikisi de yok | Workshop Supabase kayitlariyla calisir, on-chain islem yok |
| `SEPOLIA_PRIVATE_KEY` var | Fuji key'i yoksa fallback olarak kullanilir |

## Mimari Kararlar

1. **Frontend: thirdweb, Backend: viem** — Temiz ayrim. Frontend SDK wallet UI ve gasless UX saglar; backend minimal viem client ile dogrudan TX gonderir.

2. **Inline ABI** — `api/mint.ts` sadece 2 fonksiyon ABI'si icerir (`mintTo`, `totalSupply`). Full Hardhat ABI sadece test/deploy icin kullanilir.

3. **Simulated-first** — Contract deploy edilmemis olsa bile workshop isler. Sahte txHash, gercek Supabase kaydi. Ogrenci deneyimi ayni kalir.

4. **Server-side mint** — NFT mint'i kullanicinin cuzdanindan degil, backend wallet'tan yapilir (`onlyOwner`). Ogrenci gas odemez, kontrol backend'de.

5. **Gasless her sey** — Transfer: AA Paymaster karsilar. Mint: backend wallet karsilar. Faucet: backend wallet gonderir. Ogrenci hicbir zaman gas kavramiyla karsilasmaz.
