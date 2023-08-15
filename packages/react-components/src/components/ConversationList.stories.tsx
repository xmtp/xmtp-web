import type { ComponentStory, ComponentMeta } from "@storybook/react";

import type { CachedConversation } from "@xmtp/react-sdk";
import { ConversationList } from "./ConversationList";
import { ConversationPreviewCard } from "./ConversationPreviewCard";

export default {
  component: ConversationList,
  argTypes: {
    messages: { control: false },
    isLoading: { control: false },
  },
} as ComponentMeta<typeof ConversationList>;

const Template: ComponentStory<typeof ConversationList> = (args) => (
  <ConversationList {...args} />
);

export const DefaultEmptyMessage = Template.bind({});
DefaultEmptyMessage.args = {};

export const CustomEmptyMessage = Template.bind({});
CustomEmptyMessage.args = {
  renderEmpty: <div>Custom empty message</div>,
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

const conversation1 = {
  peerAddress: "0x1234",
  createdAt: new Date(),
  updatedAt: new Date(),
  isReady: false,
  topic: "topic1",
  walletAddress: "walletAddress1",
} satisfies CachedConversation;

const conversation2 = {
  peerAddress: "0x1234",
  createdAt: new Date(),
  updatedAt: new Date(),
  isReady: false,
  topic: "topic2",
  walletAddress: "walletAddress1",
} satisfies CachedConversation;

const conversation3 = {
  peerAddress: "0x1234",
  createdAt: new Date(),
  updatedAt: new Date(),
  isReady: false,
  topic: "topic3",
  walletAddress: "walletAddress1",
} satisfies CachedConversation;

export const WithConversationPreviewCard = Template.bind({});
WithConversationPreviewCard.storyName = "With ConversationPreviewCard";
WithConversationPreviewCard.args = {
  conversations: [
    <ConversationPreviewCard key="topic1" conversation={conversation1} />,
    <ConversationPreviewCard key="topic2" conversation={conversation2} />,
    <ConversationPreviewCard key="topic3" conversation={conversation3} />,
  ],
};
