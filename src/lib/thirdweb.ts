import { createThirdwebClient } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";
import { avalancheFuji } from "thirdweb/chains";

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "demo-client-id",
});

export const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
    smartAccount: {
      chain: avalancheFuji,
      sponsorGas: true,
    },
  }),
];

export const chain = avalancheFuji;
