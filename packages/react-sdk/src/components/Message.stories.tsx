import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { Message } from "./Message";

export default {
  component: Message,
} as ComponentMeta<typeof Message>;

const Template: ComponentStory<typeof Message> = (args) => (
  <Message {...args} datetime={new Date(2023, 0, 1)} />
);

export const Incoming = Template.bind({});
Incoming.args = {
  content: "Hello, world!",
  isIncoming: true,
};

export const Outgoing = Template.bind({});
Outgoing.args = {
  content: "Hello, world!",
};
