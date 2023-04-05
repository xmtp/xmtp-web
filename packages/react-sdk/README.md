# XMTP React SDK

XMTP client SDK for React applications written in TypeScript.

## What's inside?

### Hooks

These hooks are mostly bindings to the XMTP JS SDK that expose the underlying data in a React way.

### Components

These are ready-made components to help quickly build a chat application.

## Requirements

- Node 16.10+
- React 16.14+

## Installation

```bash
# npm
npm install @xmtp/react-sdk

# pnpm
pnpm install @xmtp/react-sdk

# yarn
yarn add @xmtp/react-sdk
```

### Create React App

Requires the Buffer polyfill, see below.

If you're seeing a lot of warnings related to source maps, check out [this issue](https://github.com/facebook/create-react-app/discussions/11767) to learn more.

### Vite

Requires the Buffer polyfill, see below.

### Buffer polyfill

The Node Buffer API must be polyfilled in some cases. To do so, add the `buffer` dependency to your project and then polyfill it in your entry file.

**Example**

```ts
import { Buffer } from "buffer";

window.Buffer = window.Buffer ?? Buffer;
```

### Next.js

Next.js seems to have some issues with processing ES Modules. If you experience any issues when importing `@xmtp/react-sdk`, you can disable ESM imports by updating your config.

`next.config.js`:

```js
const nextConfig = {
  experimental: {
    // disable ESM imports
    esmExternals: false,
  },
};
```

## Usage

### Include styles

If you're going to use any of the included components, you'll need to also include their styles. To do so, simply import the styles into your project from the package.

```ts
import "@xmtp/react-sdk/styles.css";
```

Most frameworks and bundlers include support for CSS imports out of the box.

### Add the provider

In order to use the provided hooks, you must wrap your application with an `XMTPProvider` so that the hooks have access to the XMTP client.

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

### Creating a client

The `useClient` hook allows you to initialize, disconnect, and access the XMTP client instance. It also exposes the error and loading states of the client.

It requires passing in a connected wallet that implements the [Signer](https://github.com/xmtp/xmtp-js/blob/main/src/types/Signer.ts) interface.

For more information about this process, see the [XMTP-JS docs](https://github.com/xmtp/xmtp-js#creating-a-client).

**Type**

```ts
import { Client } from "@xmtp/xmtp-js";
import type { ClientOptions, Signer } from "@xmtp/xmtp-js";

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

#### Configuring the client

See the [XMTP-JS docs](https://github.com/xmtp/xmtp-js#configuring-the-client) for configuration options.

#### Creating a client with private keys

It is not recommended to handle private keys manually unless you have a specific use case to do so. For more information, check out [`Manually handling private key storage`](https://github.com/xmtp/xmtp-js#manually-handling-private-key-storage)

**Example**

```tsx
import { Client } from "@xmtp/xmtp-js";
import type { Signer } from "@xmtp/xmtp-js";
import { useClient } from "@xmtp/react-sdk";

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
import type { Conversation } from "@xmtp/xmtp-js";

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

See the [XMTP-JS docs](https://github.com/xmtp/xmtp-js#list-existing-conversations) for more information.

### Listen for new conversations

The `useStreamConversations` hook listens for new conversations in real-time and call the passed callback when a new conversation is created. It also exposes an error state.

**Type**

```ts
import type { Conversation } from "@xmtp/xmtp-js";

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
import type { Conversation } from "@xmtp/xmtp-js";

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

See the [XMTP-JS docs](https://github.com/xmtp/xmtp-js#listen-for-new-conversations) for more information.

### Start a new conversation

The `useStartConversation` hook starts a new conversation and sends an initial message to it.

**Type**

```ts
import type { InvitationContext } from "@xmtp/xmtp-js/dist/types/src/Invitation";
import type { Conversation, SendOptions } from "@xmtp/xmtp-js";

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

### Sending messages

The `useSendMessage` hook sends a new message into a conversation.

**Type**

```ts
import type { Conversation, SendOptions } from "@xmtp/xmtp-js";

const useSendMessage: <T = string>(
  conversation: Conversation,
  options?: SendOptions,
) => (message: T, optionsOverride?: SendOptions) => Promise<void>;
```

**Example**

```tsx
import { MessageInput, useSendMessage } from "@xmtp/react-sdk";
import type { Conversation } from "@xmtp/xmtp-js";
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

See the [XMTP-JS docs](https://github.com/xmtp/xmtp-js#sending-messages) for more information.

#### Content types

#### Compression

### List messages in a conversation

The `useMessages` hook fetches a list of all messages within a conversation on mount. It also exposes loading and error states and whether or not there are more messages based on the options passed.

**Type**

```ts
import type {
  Conversation,
  DecodedMessage,
  ListMessagesOptions,
} from "@xmtp/xmtp-js";

const useMessages: (
  conversation?: Conversation,
  options?: ListMessagesOptions,
) => {
  error: unknown;
  isLoading: boolean;
  messages: DecodedMessage[];
  hasMore: boolean;
};
```

**Example**

```tsx
import { ConversationMessages, useMessages } from "@xmtp/react-sdk";
import type { Conversation, DecodedMessage } from "@xmtp/xmtp-js";

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

### Listen for new messages in a conversation

The `useStreamMessages` hook streams new conversation messages on mount and exposes an error state.

**Type**

```ts
import type { Conversation, DecodedMessage } from "@xmtp/xmtp-js";

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
import type { Conversation, DecodedMessage } from "@xmtp/xmtp-js";
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

See the [XMTP-JS docs](https://github.com/xmtp/xmtp-js#listen-for-new-messages-in-a-conversation) for more information.

### Listen for new messages in all conversations

The `useStreamAllMessages` hook streams new messages from all conversations on mount and exposes an error state.

**Type**

```ts
import type { DecodedMessage } from "@xmtp/xmtp-js";

const useStreamAllMessages: (onMessage: (message: DecodedMessage) => void) => {
  error: unknown;
};
```

**Example**

```tsx
import { useStreamAllMessages } from "@xmtp/react-sdk";
import type { DecodedMessage } from "@xmtp/xmtp-js";
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

See the [XMTP-JS docs](https://github.com/xmtp/xmtp-js#listen-for-new-messages-in-all-conversations) for more information.

### Checking if an address is on the network

The `useCanMessage` hook exposes both the client and static instances of the `canMessage` method. If you would like to check if a blockchain address is registered on the network before instantiating a client instance, you can use the `canMessageStatic` export.

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
- `yarn dev`: Launches Storybook for SDK components
- `yarn format`: Runs prettier format and write changes
- `yarn format:check`: Runs prettier format check
- `yarn lint`: Runs ESLint
- `yarn test`: Runs all unit tests
- `yarn typecheck`: Runs `tsc`
