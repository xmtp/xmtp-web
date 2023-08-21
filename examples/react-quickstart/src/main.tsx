import "./polyfills";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import {
  XMTPProvider,
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  readReceiptContentTypeConfig,
  replyContentTypeConfig,
} from "@xmtp/react-sdk";
import App from "./components/App";
import "@xmtp/react-components/styles.css";
import { WalletProvider } from "./contexts/WalletContext";
import "./index.css";

const DB_VERSION = 1;

const contentTypeConfigs = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  readReceiptContentTypeConfig,
  replyContentTypeConfig,
];

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet],
  [publicProvider()],
);

const { connectors } = getDefaultWallets({
  appName: "XMTP React RainbowKit Example",
  chains,
  // now required for WalletConnect V2
  projectId: import.meta.env.VITE_PROJECT_ID,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <WagmiConfig client={wagmiClient}>
    <RainbowKitProvider chains={chains}>
      <StrictMode>
        <WalletProvider>
          <XMTPProvider
            dbVersion={DB_VERSION}
            contentTypeConfigs={contentTypeConfigs}>
            <App />
          </XMTPProvider>
        </WalletProvider>
      </StrictMode>
    </RainbowKitProvider>
  </WagmiConfig>,
);
