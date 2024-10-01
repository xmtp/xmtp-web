import {
  XMTPProvider,
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
} from "@xmtp/react-sdk";
import { Client, Conversation } from "@xmtp/browser-sdk";
import { useEffect } from "react";
import { toBytes } from "viem";
import { WalletProvider } from "../contexts/WalletContext";
import { App } from "../components/App";
import { createWallet } from "../helpers/wallet";

const contentTypeConfigs = [
  attachmentContentTypeConfig,
  reactionContentTypeConfig,
  replyContentTypeConfig,
];

const wallet = createWallet("key1");

export const AppController: React.FC = () => {
  useEffect(() => {
    const run = async () => {
      try {
        const client = await Client.create(wallet.account.address, {
          env: "local",
        });
        try {
          const conversations = await client.conversations.list();
          console.log("conversations", conversations);
          const group = await client.conversations.newGroup([
            "0x4429147fa2034A270c6BF6cca2EbFDAC6834693e",
            "0x1dAd433bC4384a64F1C79CCba9151cc0Ec1fF420",
            "0x15eB3Dc17EbEEb2445A362C7E4C9f1fa90347AeB",
          ]);
          console.log("group", group);
          const conversation = new Conversation(client, group.id);
          console.log("conversation", conversation);
          const messageId = await conversation.send("gm!");
          console.log("messageId", messageId);
          const messages = await conversation.messages();
          console.log("messages", messages);
        } catch (error) {
          console.error(error);
        }

        const canMessage = await client.canMessage([
          "0x4429147fa2034A270c6BF6cca2EbFDAC6834693e",
          "0x1dAd433bC4384a64F1C79CCba9151cc0Ec1fF420",
          "0x15eB3Dc17EbEEb2445A362C7E4C9f1fa90347AeB",
          "0xFAB1487B2fDF8606Fa71377768D07ABfBdB9847D",
        ]);
        console.log("canMessage", canMessage);
      } catch (error) {
        console.error(error);
      }
    };
    void run();
  }, []);

  return (
    <WalletProvider>
      <XMTPProvider contentTypeConfigs={contentTypeConfigs}>
        <App />
      </XMTPProvider>
    </WalletProvider>
  );
};
