import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { DateDivider } from "./DateDivider";

export default {
  component: DateDivider,
} as ComponentMeta<typeof DateDivider>;

const Template: ComponentStory<typeof DateDivider> = () => (
  <DateDivider date={new Date(2023, 0, 1)} />
);

export const DateDividerDefault = Template.bind({});
DateDividerDefault.args = {};
