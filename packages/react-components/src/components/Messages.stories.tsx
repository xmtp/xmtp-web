import type { ComponentStory, ComponentMeta } from "@storybook/react";

import type { CachedMessage } from "@xmtp/react-sdk";
import { ContentTypeText } from "@xmtp/react-sdk";
import { Messages } from "./Messages";

export default {
  component: Messages,
} as ComponentMeta<typeof Messages>;

const Template: ComponentStory<typeof Messages> = (args) => (
  <Messages {...args} />
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

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

export const WithMessages = Template.bind({});
WithMessages.args = {
  clientAddress: "foo",
  messages: [message1, message2],
};
