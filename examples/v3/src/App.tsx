/* eslint-disable no-void */
import { useState } from "react";
import type { Client, SafeConversation, SafeMessage } from "@xmtp/browser-sdk";
import { ContentTypeGroupUpdated, Conversation } from "@xmtp/browser-sdk";
import { createClient } from "./createClient";

export const App = () => {
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [conversations, setConversations] = useState<SafeConversation[]>([]);
  const [messages, setMessages] = useState<Map<string, SafeMessage[]>>(
    new Map(),
  );

  const handleCreateClient = async () => {
    setClient(await createClient("key1"));
  };

  const handleResetClient = () => {
    if (client) {
      client.close();
    }
    setClient(undefined);
    setConversations([]);
    setMessages(new Map());
  };

  const handleListGroups = async () => {
    if (client) {
      const groups = await client.conversations.list();
      setConversations(groups);
    }
  };

  const handleUpdateGroupName = async (groupId: string, elementId: string) => {
    if (client) {
      const conversation = new Conversation(client, groupId);
      const element = document.getElementById(elementId) as HTMLInputElement;
      const name = element.value;
      await conversation.updateName(name);
      element.value = "";
      await handleListGroups();
    }
  };

  const handleUpdateGroupDescription = async (
    groupId: string,
    elementId: string,
  ) => {
    if (client) {
      const conversation = new Conversation(client, groupId);
      const element = document.getElementById(elementId) as HTMLInputElement;
      const description = element.value;
      await conversation.updateDescription(description);
      element.value = "";
      await handleListGroups();
    }
  };

  const handleListGroupMessages = async (groupId: string) => {
    if (client) {
      const conversation = new Conversation(client, groupId);
      const groupMessages = await conversation.messages();
      setMessages((prevMessages) => {
        const newMessages = new Map(prevMessages);
        newMessages.set(groupId, groupMessages);
        return newMessages;
      });
    }
  };

  return (
    <div className="App">
      <h1>XMTP V3</h1>
      <div className="Actions">
        {!client && (
          <button onClick={() => void handleCreateClient()} type="button">
            Create client
          </button>
        )}
        {client && (
          <>
            <button onClick={() => void handleResetClient()} type="button">
              Reset client
            </button>
            <button onClick={() => void handleListGroups()} type="button">
              List groups
            </button>
          </>
        )}
      </div>
      {client && (
        <div className="Client">
          <h2>Client details</h2>
          <div className="ClientDetail">
            <div>Address:</div>
            <div>{client.address}</div>
          </div>
          <div className="ClientDetail">
            <div>Inbox ID:</div>
            <div>{client.inboxId}</div>
          </div>
          <div className="ClientDetail">
            <div>Installation ID:</div>
            <div>{client.installationId}</div>
          </div>
        </div>
      )}
      {conversations.length > 0 && (
        <div className="Conversations">
          <h2>Conversations</h2>
          <div className="ConversationActions">
            <div className="ConversationAction">
              <input type="text" />
              <button onClick={() => void handleCreateClient()} type="button">
                Create group
              </button>
            </div>
          </div>
          <div className="ConversationWrapper">
            {conversations.map((conversation) => (
              <div className="Conversation" key={conversation.id}>
                <h3>{conversation.id}</h3>
                <div className="ConversationActions">
                  <div className="ConversationAction">
                    <input id={`group-name-${conversation.id}`} type="text" />
                    <button
                      onClick={() =>
                        void handleUpdateGroupName(
                          conversation.id,
                          `group-name-${conversation.id}`,
                        )
                      }
                      type="button">
                      Update group name
                    </button>
                  </div>
                  <div className="ConversationAction">
                    <input
                      id={`group-description-${conversation.id}`}
                      type="text"
                    />
                    <button
                      onClick={() =>
                        void handleUpdateGroupDescription(
                          conversation.id,
                          `group-description-${conversation.id}`,
                        )
                      }
                      type="button">
                      Update group description
                    </button>
                  </div>
                  <div className="ConversationAction">
                    <button
                      onClick={() =>
                        void handleListGroupMessages(conversation.id)
                      }
                      type="button">
                      List messages
                    </button>
                  </div>
                </div>
                <div className="ConversationDetail">
                  <div>Name:</div>
                  <div>{conversation.name}</div>
                </div>
                <div className="ConversationDetail">
                  <div>Description:</div>
                  <div>{conversation.description}</div>
                </div>
                {messages.get(conversation.id) && (
                  <div className="ConversationMessages">
                    <h3>Messages</h3>
                    {messages.get(conversation.id)?.map((message) => (
                      <div className="ConversationMessage" key={message.id}>
                        <pre>
                          {JSON.stringify(
                            client?.decodeContent(
                              message,
                              ContentTypeGroupUpdated,
                            ),
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};