import {
  XMTPProvider,
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
} from "@xmtp/react-sdk";
import { WalletProvider } from "../contexts/WalletContext";
import { App } from "../components/App";

const contentTypeConfigs = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
];

export const AppController: React.FC = () => (
  <WalletProvider>
    <XMTPProvider contentTypeConfigs={contentTypeConfigs}>
      <App />
    </XMTPProvider>
  </WalletProvider>
);
