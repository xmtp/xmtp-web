import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount, Transport, WalletClient } from "viem";
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";

const keys: Record<string, `0x${string}`> = {
  key1: "0xf8ced372cdb9a67bed1843650a89a59859369bf9900c0bc75741f2740e93cb04",
  key2: "0xb562d61bc9fe203a639dfc0c3f875b3411fe8ae211c5722ab9124a1009bda32a",
  key3: "0x724028dcbf931ff1f2730ad76c0b7b8b07dbf7f0a56408be3e305be1b81edfe0",
  key4: "0x4420cde3d475a038739d1d47cfd690799c0f2e1b84d871c24f221c2dee4e4121",
  key5: "0xd34cc37587785349013f3f10cadbe7bf8dfeb8a95c86724887e58816b734fcfb",
};

export const createWallet = (
  key: keyof typeof keys,
): WalletClient<Transport, typeof mainnet, PrivateKeyAccount> =>
  createWalletClient({
    account: privateKeyToAccount(keys[key] ?? generatePrivateKey()),
    chain: mainnet,
    transport: http(),
  });
