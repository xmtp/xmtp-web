import type { ComponentStory, ComponentMeta } from "@storybook/react";
import type { CachedConversation } from "@xmtp/react-sdk";
import { ConversationPreviewCard } from "./ConversationPreviewCard";

export default {
  component: ConversationPreviewCard,
  argTypes: {
    text: { control: "text" },
    displayAddress: { control: "text" },
    avatar: { control: false },
    datetime: { control: false },
  },
} as ComponentMeta<typeof ConversationPreviewCard>;

const Template: ComponentStory<typeof ConversationPreviewCard> = (args) => (
  <ConversationPreviewCard {...args} />
);

const conversation1 = {
  peerAddress: "0x1234",
  createdAt: new Date(),
  updatedAt: new Date(),
  isReady: false,
  topic: "topic1",
  walletAddress: "walletAddress1",
} satisfies CachedConversation;

export const Default = Template.bind({});
Default.args = {
  conversation: conversation1,
};
