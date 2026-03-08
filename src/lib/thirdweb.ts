import { createThirdwebClient } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";
import { defineChain } from "thirdweb/chains";
import { brand } from "@/config/brand";

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "demo-client-id",
});

export const chain = defineChain(brand.chainId);

export const wallets = [
  inAppWallet({
    auth: {
      options: ["email", "google"],
    },
    smartAccount: {
      chain,
      sponsorGas: true,
    },
  }),
];
