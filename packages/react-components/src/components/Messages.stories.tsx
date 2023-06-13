import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { ContentTypeId } from "@xmtp/react-sdk";
import { Messages } from "./Messages";

export default {
  component: Messages,
} as ComponentMeta<typeof Messages>;

const Template: ComponentStory<typeof Messages> = (args) => (
  <Messages {...args} />
);

const mockContentType = new ContentTypeId({
  authorityId: "test-authorityId",
  typeId: "test-typeId",
  versionMajor: 1,
  versionMinor: 1,
});

export const Loading = Template.bind({});
Loading.args = {
  isLoading: true,
};

export const WithMessages = Template.bind({});
WithMessages.args = {
  clientAddress: "foo",
  messages: [
    {
      contentTopic: "",
      content: "cool",
      contentType: mockContentType,
      id: "message6",
      recipientAddress: "foo",
      senderAddress: "bar",
      sent: new Date(2023, 0, 2, 0, 4, 0),
    },
    {
      contentTopic: "",
      content: "cool",
      contentType: mockContentType,
      id: "message5",
      recipientAddress: "bar",
      senderAddress: "foo",
      sent: new Date(2023, 0, 2, 0, 3, 20),
    },
    {
      contentTopic: "",
      content: "same",
      contentType: mockContentType,
      id: "message4",
      recipientAddress: "foo",
      senderAddress: "bar",
      sent: new Date(2023, 0, 1, 23, 59, 10),
    },
    {
      contentTopic: "",
      content: "chillin",
      contentType: mockContentType,
      id: "message3",
      recipientAddress: "bar",
      senderAddress: "foo",
      sent: new Date(2023, 0, 1, 23, 59, 0),
    },
    {
      contentTopic: "",
      content: "sup?",
      contentType: mockContentType,
      id: "message2",
      recipientAddress: "foo",
      senderAddress: "bar",
      sent: new Date(2023, 0, 1, 23, 58, 5),
    },
    {
      contentTopic: "",
      content: "hey",
      contentType: mockContentType,
      id: "message1",
      recipientAddress: "bar",
      senderAddress: "foo",
      sent: new Date(2023, 0, 1, 23, 58, 0),
    },
  ],
};
