import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { Avatar } from "./Avatar";

export default {
  component: Avatar,
  argTypes: {
    address: { control: false },
  },
} as ComponentMeta<typeof Avatar>;

const Template: ComponentStory<typeof Avatar> = (args) => (
  <Avatar address="0x194c31cAe1418D5256E8c58e0d08Aee1046C6Ed0" {...args} />
);

export const CustomImage = Template.bind({});
CustomImage.args = {
  url: "https://picsum.photos/200/300",
};

export const Default = Template.bind({});
Default.args = {};

export const NoAddress = Template.bind({});
NoAddress.args = {
  address: "",
};

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};
