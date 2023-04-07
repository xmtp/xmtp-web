import "./polyfills";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { XMTPProvider } from "@xmtp/react-sdk";
import App from "./components/App";
import "@xmtp/react-sdk/style.css";
import { WalletProvider } from "./contexts/WalletContext";
import "./index.css";

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet],
  [publicProvider()],
);

const { connectors } = getDefaultWallets({
  appName: "XMTP React RainbowKit Example",
  chains,
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
          <XMTPProvider>
            <App />
          </XMTPProvider>
        </WalletProvider>
      </StrictMode>
    </RainbowKitProvider>
  </WagmiConfig>,
);
