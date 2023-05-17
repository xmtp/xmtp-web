import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { MessageSkeletonLoader } from "./MessageSkeletonLoader";

export default {
  component: MessageSkeletonLoader,
  argTypes: {},
} as ComponentMeta<typeof MessageSkeletonLoader>;

const Template: ComponentStory<typeof MessageSkeletonLoader> = (args) => (
  <MessageSkeletonLoader {...args} />
);

export const Incoming = Template.bind({});
Incoming.args = {};

export const Outgoing = Template.bind({});
Outgoing.args = {
  incoming: false,
};
