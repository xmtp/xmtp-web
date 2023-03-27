import type { ComponentStory, ComponentMeta } from "@storybook/react";
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

export const Default = Template.bind({});
Default.args = {
  text: "Hello there",
  displayAddress: "hi.xmtp.eth",
  datetime: new Date(2023, 0, 1),
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};
