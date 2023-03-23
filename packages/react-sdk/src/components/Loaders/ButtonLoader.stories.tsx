import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { ButtonLoader } from "./ButtonLoader";

export default {
  component: ButtonLoader,
  argTypes: {},
} as ComponentMeta<typeof ButtonLoader>;

const Template: ComponentStory<typeof ButtonLoader> = (args) => (
  <ButtonLoader {...args} />
);

export const Small = Template.bind({});
Small.args = {
  size: "small",
};

export const Large = Template.bind({});
Large.args = {
  size: "large",
};
