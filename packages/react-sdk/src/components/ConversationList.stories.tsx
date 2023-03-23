import type { ComponentStory, ComponentMeta } from "@storybook/react";

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

export const WithConversationPreviewCard = Template.bind({});
WithConversationPreviewCard.storyName = "With ConversationPreviewCard";
WithConversationPreviewCard.args = {
  conversations: [
    <ConversationPreviewCard key="topic1" />,
    <ConversationPreviewCard
      key="topic2"
      text="Lorem ipsum"
      displayAddress="testing.eth"
    />,
    <ConversationPreviewCard key="topic3" text="bar" displayAddress="foo" />,
  ],
};
