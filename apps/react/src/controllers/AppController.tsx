import {
  XMTPProvider,
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
} from "@xmtp/react-sdk";
import { WalletProvider } from "../contexts/WalletContext";
import { App } from "../components/App";

const DB_VERSION = 1;

const contentTypeConfigs = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
];

export const AppController: React.FC = () => (
  <WalletProvider>
    <XMTPProvider
      dbVersion={DB_VERSION}
      contentTypeConfigs={contentTypeConfigs}>
      <App />
    </XMTPProvider>
  </WalletProvider>
);
