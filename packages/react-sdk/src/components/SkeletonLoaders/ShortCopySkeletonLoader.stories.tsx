import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { ShortCopySkeletonLoader } from "./ShortCopySkeletonLoader";

export default {
  component: ShortCopySkeletonLoader,
  argTypes: {},
} as ComponentMeta<typeof ShortCopySkeletonLoader>;

const Template: ComponentStory<typeof ShortCopySkeletonLoader> = (args) => (
  <ShortCopySkeletonLoader {...args} />
);

export const OneLiner = Template.bind({});
OneLiner.args = {};

export const TwoLiner = Template.bind({});
TwoLiner.args = {
  lines: 2,
};
