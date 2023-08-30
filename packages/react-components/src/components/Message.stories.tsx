import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { ContentTypeText, type CachedMessage } from "@xmtp/react-sdk";
import { Message } from "./Message";

export default {
  component: Message,
} as ComponentMeta<typeof Message>;

const Template: ComponentStory<typeof Message> = (args) => (
  <Message {...args} />
);

const message1 = {
  id: 1,
  content: "Hello!",
  contentType: ContentTypeText.toString(),
  isSending: false,
  hasLoadError: false,
  hasSendError: false,
  sentAt: new Date(2023, 0, 2, 0, 4, 0),
  conversationTopic: "topic1",
  senderAddress: "0x1234",
  status: "processed",
  xmtpID: "1",
  uuid: "uuid1",
  walletAddress: "walletAddress1",
} satisfies CachedMessage;

export const Incoming = Template.bind({});
Incoming.args = {
  message: message1,
  isIncoming: true,
};

const message2 = {
  id: 2,
  content: "Hi!",
  contentType: ContentTypeText.toString(),
  isSending: false,
  hasLoadError: false,
  hasSendError: false,
  sentAt: new Date(2023, 0, 2, 0, 3, 20),
  conversationTopic: "topic1",
  senderAddress: "0x5678",
  status: "processed",
  xmtpID: "2",
  uuid: "uuid2",
  walletAddress: "walletAddress1",
} satisfies CachedMessage;

export const Outgoing = Template.bind({});
Outgoing.args = {
  message: message2,
};
