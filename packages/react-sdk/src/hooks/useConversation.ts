import { useCallback, useContext } from "react";
import { getLastMessage as _getLastMessage } from "@/helpers/caching/messages";
import type { CachedConversation } from "@/helpers/caching/conversations";
import {
  getCachedConversationByTopic,
  getConversationByTopic,
  hasConversationTopic as _hasConversationTopic,
  processConversation as _processConversation,
  saveConversation as _saveConversation,
  updateConversation as _updateConversation,
  updateConversationMetadata,
  getCachedConversationByPeerAddress,
} from "@/helpers/caching/conversations";
import type { RemoveLastParameter } from "@/sharedTypes";
import { useClient } from "@/hooks/useClient";
import { useDb } from "@/hooks/useDb";
import { XMTPContext } from "@/contexts/XMTPContext";

export const useConversationInternal = () => {
  const xmtpContext = useContext(XMTPContext);
  const { conversationProcessors } = xmtpContext;
  const { client } = useClient();
  const { db } = useDb();

  const processConversation = useCallback(
    async (conversation: CachedConversation) =>
      client
        ? _processConversation({
            client,
            conversation,
            db,
            processors: conversationProcessors,
          })
        : undefined,
    [client, conversationProcessors, db],
  );

  const saveConversation = useCallback(
    (conversation: CachedConversation) =>
      client ? _saveConversation(conversation, db) : undefined,
    [client, db],
  );

  const updateConversation = useCallback<
    RemoveLastParameter<typeof _updateConversation>
  >(
    async (conversation, update) => {
      await _updateConversation(conversation, update, db);
    },
    [db],
  );

  const updateMetadata = useCallback<
    RemoveLastParameter<typeof updateConversationMetadata>
  >(
    async (conversation, namespace, data) => {
      if (client) {
        await updateConversationMetadata(
          client.address,
          conversation,
          namespace,
          data,
          db,
        );
      }
    },
    [client, db],
  );

  return {
    processConversation,
    saveConversation,
    updateConversation,
    updateMetadata,
  };
};

/**
 * This hook returns helper functions for working with conversations in the
 * local cache.
 */
export const useConversation = () => {
  const { client } = useClient();
  const { db } = useDb();

  const getByTopic = useCallback(
    async (topic: string) =>
      client ? getConversationByTopic(topic, client) : undefined,
    [client],
  );

  const getCachedByTopic = useCallback(
    async (topic: string) =>
      client
        ? getCachedConversationByTopic(client.address, topic, db)
        : undefined,
    [client, db],
  );

  const getCachedByPeerAddress = useCallback(
    async (peerAddress: string) =>
      client
        ? getCachedConversationByPeerAddress(client.address, peerAddress, db)
        : undefined,
    [client, db],
  );

  const getLastMessage = useCallback(
    async (topic: string) => _getLastMessage(topic, db),
    [db],
  );

  const hasConversationTopic = useCallback(
    async (topic: string) =>
      client ? _hasConversationTopic(client.address, topic, db) : false,
    [client, db],
  );

  return {
    getByTopic,
    getCachedByTopic,
    getCachedByPeerAddress,
    getLastMessage,
    hasConversationTopic,
  };
};
