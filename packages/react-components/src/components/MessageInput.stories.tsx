import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { MessageInput } from "./MessageInput";

export default {
  component: MessageInput,
  argTypes: {
    variant: { control: false },
    subtext: { control: false },
    avatarUrlProps: { control: false },
    isError: { control: false },
    isLoading: { control: false },
  },
} as ComponentMeta<typeof MessageInput>;

const Template: ComponentStory<typeof MessageInput> = (args) => (
  <MessageInput {...args} placeholder="Type something..." />
);

export const Default = Template.bind({});
Default.args = {};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};
