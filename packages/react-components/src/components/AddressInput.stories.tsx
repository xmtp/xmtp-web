import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { AddressInput } from "./AddressInput";

export default {
  component: AddressInput,
  argTypes: {
    variant: { control: false },
    resolvedAddress: { control: false },
    isDisabled: { control: false },
    avatarUrlProps: { control: false },
  },
} as ComponentMeta<typeof AddressInput>;

const Template: ComponentStory<typeof AddressInput> = (args) => (
  <AddressInput {...args} label="To:" />
);

export const Default = Template.bind({});
Default.args = {
  subtext: "Please enter a valid wallet address",
};

export const ResolvedAddress = Template.bind({});
ResolvedAddress.args = {
  resolvedAddress: {
    displayAddress: "hi.xmtp.eth",
    walletAddress: "0x194c31cAe1418D5256E8c58e0d08Aee1046C6Ed0",
  },
  avatarUrlProps: {
    address: "0x194c31cAe1418D5256E8c58e0d08Aee1046C6Ed0",
  },
};

export const WithLeftIcon = Template.bind({});
WithLeftIcon.args = {
  onLeftIconClick: () => {},
};

export const Loading = Template.bind({});
Loading.args = {
  subtext: "Fetching ENS address...",
  isLoading: true,
};

export const Error = Template.bind({});
Error.args = {
  subtext: "Error fetching address",
  isError: true,
};
