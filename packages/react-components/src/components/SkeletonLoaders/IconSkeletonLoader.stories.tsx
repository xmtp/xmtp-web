import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { IconSkeletonLoader } from "./IconSkeletonLoader";

export default {
  component: IconSkeletonLoader,
  argTypes: {},
} as ComponentMeta<typeof IconSkeletonLoader>;

const Template: ComponentStory<typeof IconSkeletonLoader> = () => (
  <IconSkeletonLoader />
);

export const Default = Template.bind({});
Default.args = {};
