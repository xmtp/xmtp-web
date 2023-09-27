import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";

export const createRandomWallet = () =>
  createWalletClient({
    account: privateKeyToAccount(generatePrivateKey()),
    chain: mainnet,
    transport: http(),
  });
