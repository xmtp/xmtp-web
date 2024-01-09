import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount, Transport, WalletClient } from "viem";
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";

export const createRandomWallet = (): WalletClient<
  Transport,
  typeof mainnet,
  PrivateKeyAccount
> =>
  createWalletClient({
    account: privateKeyToAccount(generatePrivateKey()),
    chain: mainnet,
    transport: http(),
  });
