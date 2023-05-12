# React XMTP client SDK

![Status](https://img.shields.io/badge/Project_Status-Developer_Preview-yellow)

This package provides the XMTP client SDK for React.

This SDK is in **Developer Preview** status and ready for you to start building with.

However, we do **not** recommend using Developer Preview software in production apps. Software in this status may change based on feedback.

To keep up with the latest SDK developments, see the [Issues tab](https://github.com/xmtp/xmtp-web/issues) in this repo.

To learn more about XMTP and get answers to frequently asked questions, see [FAQ about XMTP](https://xmtp.org/docs/dev-concepts/faq).

![x-red-sm](https://user-images.githubusercontent.com/510695/163488403-1fb37e86-c673-4b48-954e-8460ae4d4b05.png)

## What's inside?

### Hooks

These hooks are mostly bindings to the [`xmtp-js` SDK](https://github.com/xmtp/xmtp-js) that expose the underlying data in a React way.

### Components

These ready-made components can help you quickly build a chat app.

## Requirements

- Node 16.10+
- React 16.14+
- Yarn v3+. See [Yarn Installation](https://yarnpkg.com/getting-started/install).

## Install

```bash
yarn add @xmtp/react-sdk@preview
```

### Create React App

Requires the Buffer polyfill. See below.

If you see a lot of warnings related to source maps, see [this issue](https://github.com/facebook/create-react-app/discussions/11767) to learn more.

### Vite

Requires the Buffer polyfill. See below.

### Buffer polyfill

The Node Buffer API must be polyfilled in some cases. To do so, add the `buffer` dependency to your project and then polyfill it in your entry file.

**Example**

```ts
import { Buffer } from "buffer";

window.Buffer = window.Buffer ?? Buffer;
```

## Usage

### Include styles

To use any of the included components, you must also include their styles. To do so, import the styles from the package into your project.

```ts
import "@xmtp/react-sdk/styles.css";
```

**Note:** The included styles contain normalizations of elements globally.

### Add the provider

To use the provided hooks, you must wrap your app with an `XMTPProvider`. This gives the hooks access to the XMTP client.

**Example**

```tsx
createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <XMTPProvider>
      <App />
    </XMTPProvider>
  </StrictMode>,
);
```

### Create a client

The `useClient` hook allows you to initialize, disconnect, and access the XMTP client instance. It also exposes the error and loading states of the client.

The hook requires passing in a connected wallet that implements the [Signer](https://github.com/xmtp/xmtp-js/blob/main/src/types/Signer.ts) interface.

To learn more about this process, see [Create a client](https://github.com/xmtp/xmtp-js#create-a-client) in the `xmtp-js` SDK docs.

**Type**

```ts
import { Client } from "@xmtp/react-sdk";
import type { ClientOptions, Signer } from "@xmtp/react-sdk";

const useClient: ({
  options,
  signer,
}: {
  options?: ClientOptions;
  signer?: Signer | null;
}) => {
  client: Client | undefined;
  disconnect: () => void;
  error: unknown;
  initialize: (keys?: Uint8Array) => Promise<void>;
  isLoading: boolean;
};
```

**Example**

```tsx
export const CreateClient: React.FC<{ signer: Signer }> = ({ signer }) => {
  const { client, error, isLoading, initialize } = useClient({ signer });

  const handleConnect = useCallback(async () => {
    await initialize();
  }, [initialize]);

  if (error) {
    return "An error occurred while initializing the client";
  }

  if (isLoading) {
    return "Awaiting signatures...";
  }

  if (!client) {
    return (
      <button type="button" onClick={handleConnect}>
        Connect to XMTP
      </button>
    );
  }

  return "Connected to XMTP";
};
```

#### Configure the client

To learn more about client configuration options, see [Configure the client](https://github.com/xmtp/xmtp-js#configure-the-client) in the `xmtp-js` SDK docs.

#### Create a client with private keys

Manually handling private keys is not recommended unless a use case requires it.

To learn more, see [Manually handle private key storage](https://github.com/xmtp/xmtp-js#manually-handle-private-key-storage) in the `xmtp-js` SDK docs.

**Example**

```tsx
import { Client, useClient } from "@xmtp/react-sdk";
import type { Signer } from "@xmtp/react-sdk";

export const CreateClientWithKeys: React.FC<{ signer: Signer }> = ({ signer }) => {
  const { initialize } = useClient({ signer });

  // initialize client on mount
  useEffect(() => {
    const init = async () => {
      // get the keys using a valid Signer
      const keys = await Client.getKeys(signer);
      // create a client using keys returned from getKeys
      await initialize(keys);
    };
    void init();
  }, []);

  return (
    ...
  );
};
```

### List existing conversations

The `useConversations` hook fetches all conversations with the current wallet on mount. It also exposes error and loading states.

**Type**

```ts
import type { Conversation } from "@xmtp/react-sdk";

const useConversations: () => {
  conversations: Conversation[];
  error: unknown;
  isLoading: boolean;
};
```

**Example**

```tsx
export const ListConversations: React.FC = () => {
  const { conversations, error, isLoading } = useConversations();

  if (error) {
    return "An error occurred while fetching conversations";
  }

  return (
    <ConversationPreviewList
      isLoading={isLoading}
      conversations={conversations}
    />
  );
};
```

To learn more, see [List existing conversations](https://github.com/xmtp/xmtp-js#list-existing-conversations) in the `xmtp-js` SDK docs.

### Listen for new conversations

The `useStreamConversations` hook listens for new conversations in real-time and calls the passed callback when a new conversation is created. It also exposes an error state.

**Type**

```ts
import type { Conversation } from "@xmtp/react-sdk";

const useStreamConversations: (
  onConversation: (conversation: Conversation) => void,
) => {
  error: unknown;
};
```

**Example**

```tsx
import { useCallback, useState } from "react";
import { useStreamConversations } from "@xmtp/react-sdk";
import type { Conversation } from "@xmtp/react-sdk";

export const NewConversations: React.FC = () => {
  // track streamed conversations
  const [streamedConversations, setStreamedConversations] = useState<
    Conversation[]
  >([]);

  // callback to handle incoming conversations
  const onConversation = useCallback(
    (conversation: Conversation) => {
      setStreamedConversations((prev) => [...prev, conversation]);
    },
    [],
  );
  const { error } = useStreamConversations(onConversation);

  if (error) {
    return "An error occurred while streaming conversations";
  }

  return (
    ...
  );
};
```

To learn more, see [Listen for new conversations](https://github.com/xmtp/xmtp-js#listen-for-new-conversations) in the `xmtp-js` SDK docs.

### Start a new conversation

The `useStartConversation` hook starts a new conversation and sends an initial message to it.

**Type**

```ts
import type {
  Conversation,
  InvitationContext,
  SendOptions,
} from "@xmtp/react-sdk";

const useStartConversation: <T = string>(
  options?: InvitationContext,
) => (
  peerAddress: string,
  message: T,
  sendOptions?: SendOptions,
) => Promise<Conversation | undefined>;
```

**Example**

```tsx
import {
  MessageInput,
  isValidAddress,
  useStartConversation,
} from "@xmtp/react-sdk";
import { useCallback, useState } from "react";

export const StartConversation: React.FC = () => {
  const [peerAddress, setPeerAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startConversation = useStartConversation();

  const handleChange = useCallback((updatedValue: string) => {
    setPeerAddress(updatedValue);
  }, []);

  const handleStartConversation = useCallback(
    async (message: string) => {
      if (peerAddress) {
        setIsLoading(true);
        const conversation = await startConversation(peerAddress, message);
        setIsLoading(false);
      }
    },
    [peerAddress, startConversation],
  );

  return (
    <MessageInput
      isDisabled={isLoading || !isValidAddress(peerAddress) || isError}
      onSubmit={handleStartConversation}
    />
  );
};
```

### Send messages

The `useSendMessage` hook sends a new message into a conversation.

**Type**

```ts
import type { Conversation, SendOptions } from "@xmtp/react-sdk";

const useSendMessage: <T = string>(
  conversation: Conversation,
  options?: SendOptions,
) => (message: T, optionsOverride?: SendOptions) => Promise<void>;
```

**Example**

```tsx
import { MessageInput, useSendMessage } from "@xmtp/react-sdk";
import type { Conversation } from "@xmtp/react-sdk";
import { useCallback, useState } from "react";

export const SendMessage: React.FC<{ conversation: Conversation }> = ({
  conversation,
}) => {
  const [isSending, setIsSending] = useState(false);
  const sendMessage = useSendMessage(conversation);

  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsSending(true);
      await sendMessage(message);
      setIsSending(false);
    },
    [sendMessage],
  );

  return <MessageInput isDisabled={isSending} onSubmit={handleSendMessage} />;
};
```

To learn more, see [Send messages](https://github.com/xmtp/xmtp-js#send-messages) in the `xmtp-js` SDK docs.

### List messages in a conversation

The `useMessages` hook fetches a list of all messages within a conversation on mount. It also exposes loading and error states and whether there are more messages based on the options passed.

**Type**

```ts
import type {
  Conversation,
  DecodedMessage,
  ListMessagesOptions,
} from "@xmtp/react-sdk";

export type UseMessagesOptions = ListMessagesOptions & {
  /**
   * Callback function to execute when new messages are fetched
   */
  onMessages?: (
    messages: DecodedMessage[],
    options: ListMessagesOptions,
  ) => void;
};

const useMessages: (
  conversation?: Conversation,
  options?: UseMessagesOptions,
) => {
  error: unknown;
  hasMore: boolean;
  isLoading: boolean;
  messages: DecodedMessage[];
  next: () => Promise<DecodedMessage[]>;
};
```

**Note:** It's important to memoize the `options` argument so that the hook doesn't fetch messages endlessly.

**Example**

```tsx
import { ConversationMessages, useMessages } from "@xmtp/react-sdk";
import type { Conversation, DecodedMessage } from "@xmtp/react-sdk";

export const Messages: React.FC<{
  conversation: Conversation;
}> = ({ conversation }) => {
  const { error, messages, isLoading } = useMessages(conversation);

  if (error) {
    return "An error occurred while loading messages";
  }

  if (isLoading) {
    return "Loading messages...";
  }

  return (
    <ConversationMessages
      isLoading={isLoading}
      messages={messages}
      clientAddress={conversation?.clientAddress ?? ""}
    />
  );
};
```

#### Page through messages

If a conversation has a lot of messages, it's more performant to page through them rather than fetching them all at once. This can be accomplished by using the `limit` option to limit the number of messages to fetch at a time.

**Example**

```tsx
import { ConversationMessages, useMessages } from "@xmtp/react-sdk";
import type { Conversation, DecodedMessage } from "@xmtp/react-sdk";

export const PagedMessages: React.FC<{
  conversation: Conversation;
}> = ({ conversation }) => {
  // it's important to memoize the options so that messages are not
  // fetched continuously
  const options = useMemo(
    () => ({
      limit: 20,
    }),
    [],
  );

  const { error, isLoading, messages, next } = useMessages(
    conversation,
    options,
  );

  const handleClick = useCallback(() => {
    // fetch next page of messages
    next();
  }, [next]);

  if (error) {
    return "An error occurred while loading messages";
  }

  if (isLoading) {
    return "Loading messages...";
  }

  return (
    <>
      <ConversationMessages
        isLoading={isLoading}
        messages={messages}
        clientAddress={conversation?.clientAddress ?? ""}
      />
      <button type="button" onClick={handleClick}>
        Load more messages
      </button>
    </>
  );
};
```

### Listen for new messages in a conversation

The `useStreamMessages` hook streams new conversation messages on mount and exposes an error state.

**Type**

```ts
import type { Conversation, DecodedMessage } from "@xmtp/react-sdk";

const useStreamMessages: (
  conversation: Conversation,
  onMessage: (message: DecodedMessage) => void,
) => {
  error: unknown;
};
```

**Example**

```tsx
import { useStreamMessages } from "@xmtp/react-sdk";
import type { Conversation, DecodedMessage } from "@xmtp/react-sdk";
import { useCallback, useEffect, useState } from "react";

export const StreamMessages: React.FC<{
  conversation: Conversation;
}> = ({
  conversation,
}) => {
  // track streamed messages
  const [streamedMessages, setStreamedMessages] = useState<DecodedMessage[]>(
    [],
  );

  // callback to handle incoming messages
  const onMessage = useCallback(
    (message: DecodedMessage) => {
      setStreamedMessages((prev) => [...prev, message]);
    },
    [streamedMessages],
  );

  useStreamMessages(conversation, onMessage);

  useEffect(() => {
    setStreamedMessages([]);
  }, [conversation]);

  return (
    ...
  );
};
```

To learn more, see [Listen for new messages in a conversation](https://github.com/xmtp/xmtp-js#listen-for-new-messages-in-a-conversation) in the `xmtp-js` SDK docs.

### Listen for new messages in all conversations

The `useStreamAllMessages` hook streams new messages from all conversations on mount and exposes an error state.

**Type**

```ts
import type { DecodedMessage } from "@xmtp/react-sdk";

const useStreamAllMessages: (onMessage: (message: DecodedMessage) => void) => {
  error: unknown;
};
```

**Example**

```tsx
import { useStreamAllMessages } from "@xmtp/react-sdk";
import type { DecodedMessage } from "@xmtp/react-sdk";
import { useCallback, useState } from "react";

export const StreamAllMessages: React.FC = () => {
  // track streamed messages
  const [streamedMessages, setStreamedMessages] = useState<DecodedMessage[]>(
    [],
  );

  // callback to handle incoming messages
  const onMessage = useCallback(
    (message: DecodedMessage) => {
      setStreamedMessages((prev) => [...prev, message]);
    },
    [streamedMessages],
  );

  useStreamAllMessages(onMessage);

  return (
    ...
  );
};
```

To learn more, see [Listen for new messages in all conversations](https://github.com/xmtp/xmtp-js#listen-for-new-messages-in-all-conversations) in the `xmtp-js` SDK docs.

### Check if an address is on the network

The `useCanMessage` hook exposes both the client and static instances of the `canMessage` method. To check if a blockchain address is registered on the network before instantiating a client instance, use the `canMessageStatic` export.

**Type**

```ts
type NetworkOptions = {
  env: "local" | "dev" | "production";
  apiUrl: string | undefined;
  appVersion?: string;
};

const useCanMessage: () => {
  canMessage: {
    (peerAddress: string): Promise<boolean>;
    (peerAddress: string[]): Promise<boolean[]>;
  };
  canMessageStatic: {
    (peerAddress: string, opts?: Partial<NetworkOptions>): Promise<boolean>;
    (peerAddress: string[], opts?: Partial<NetworkOptions>): Promise<boolean[]>;
  };
};
```

**Example**

```tsx
import { useCanMessage } from "@xmtp/react-sdk";

export const CanMessage: React.FC = () => {
  const [peerAddress, setPeerAddress] = useState("");
  const [isOnNetwork, setIsOnNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { canMessage } = useCanMessage();

  const handleChange = useCallback((updatedValue: string) => {
    setPeerAddress(updatedValue);
  }, []);

  useEffect(() => {
    const checkAddress = async () => {
      if (isValidAddress(peerAddress)) {
        setIsLoading(true);
        setIsOnNetwork(await canMessage(peerAddress));
        setIsLoading(false);
      } else {
        setIsOnNetwork(false);
      }
    };
    void checkAddress();
  }, [canMessage, peerAddress]);

  let subtext: string | undefined;
  let isError = false;
  if (peerAddress === "") {
    subtext = "Enter a 0x wallet address";
  } else if (isLoading) {
    subtext = "Finding address on the XMTP network...";
  } else if (!isValidAddress(peerAddress)) {
    subtext = "Please enter a valid 0x wallet address";
  } else if (!isOnNetwork) {
    subtext =
      "Sorry, we can't message this address because its owner hasn't used it with XMTP yet";
    isError = true;
  }

  return (
    <AddressInput
      subtext={subtext}
      value={peerAddress}
      onChange={handleChange}
      isError={isError}
      avatarUrlProps={{
        address: isOnNetwork ? peerAddress : "",
      }}
    />
  );
};
```

## Developing

Run `yarn dev` to build the SDK on changes and launch Storybook.

## Useful commands

- `yarn build`: Builds the SDK
- `yarn clean`: Removes `node_modules`, `lib`, and `.turbo` folders
- `yarn dev`: Develop the `react-sdk` package
- `yarn storybook`: Launches Storybook for SDK components at `http://localhost:6006`
- `yarn format`: Runs prettier format and write changes
- `yarn format:check`: Runs prettier format check
- `yarn lint`: Runs ESLint
- `yarn test`: Runs all unit tests
- `yarn typecheck`: Runs `tsc`

## 🏗 **Breaking revisions**

Because this SDK is in active development, you should expect breaking revisions that might require you to adopt the latest SDK release to enable your app to continue working as expected.

XMTP communicates about breaking revisions in the [XMTP Discord community](https://discord.gg/xmtp), providing as much advance notice as possible. Additionally, breaking revisions in a release are described on the [Releases page](https://github.com/xmtp/xmtp-react/releases).

## Deprecation

Older versions of the SDK will eventually be deprecated, which means:

1. The network will not support and eventually actively reject connections from clients using deprecated versions.
2. Bugs will not be fixed in deprecated versions.

The following table provides the deprecation schedule.

| Announced                                                      | Effective | Minimum Version | Rationale |
| -------------------------------------------------------------- | --------- | --------------- | --------- |
| There are no deprecations scheduled for this SDK at this time. |           |                 |           |

Bug reports, feature requests, and PRs are welcome in accordance with these [contribution guidelines](https://github.com/xmtp/xmtp-react/blob/main/CONTRIBUTING.md).

## XMTP `production` and `dev` network environments

XMTP provides both `production` and `dev` network environments to support the development phases of your project.

The `production` and `dev` networks are completely separate and not interchangeable.
For example, for a given blockchain account, its XMTP identity on `dev` network is completely distinct from its XMTP identity on the `production` network, as are the messages associated with these identities. In addition, XMTP identities and messages created on the `dev` network can't be accessed from or moved to the `production` network, and vice versa.

> **Important:**  
> When you [create a client](#create-a-client), it connects to the XMTP `dev` environment by default. To learn how to use the `env` parameter to set your client's network environment, see [Configure the client](#configure-the-client).

The `env` parameter accepts one of three valid values: `dev`, `production`, or `local`. Here are some best practices for when to use each environment:

- `dev`: Use to have a client communicate with the `dev` network. As a best practice, set `env` to `dev` while developing and testing your app. Follow this best practice to isolate test messages to `dev` inboxes.

- `production`: Use to have a client communicate with the `production` network. As a best practice, set `env` to `production` when your app is serving real users. Follow this best practice to isolate messages between real-world users to `production` inboxes.

- `local`: Use to have a client communicate with an XMTP node you are running locally. For example, an XMTP node developer can set `env` to `local` to generate client traffic to test a node running locally.

The `production` network is configured to store messages indefinitely. XMTP may occasionally delete messages and keys from the `dev` network, and will provide advance notice in the [XMTP Discord community](https://discord.gg/xmtp).
