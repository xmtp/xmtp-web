import { useCallback } from "react";
import { getLastMessage as _getLastMessage } from "@/helpers/caching/messages";
import type { CachedConversation } from "@/helpers/caching/conversations";
import {
  getCachedConversationByTopic,
  getConversationByTopic,
  hasTopic as _hasTopic,
  saveConversation as _saveConversation,
  updateConversation as _updateConversation,
  updateConversationMetadata,
  getCachedConversationByPeerAddress,
} from "@/helpers/caching/conversations";
import type { RemoveLastParameter } from "@/sharedTypes";
import { useClient } from "@/hooks/useClient";
import { useDb } from "@/hooks/useDb";

export const useConversationInternal = () => {
  const { client } = useClient();
  const { db } = useDb();

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
      await updateConversationMetadata(conversation, namespace, data, db);
    },
    [db],
  );

  return {
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

  const getByTopic = useCallback<
    RemoveLastParameter<typeof getConversationByTopic>
  >(
    async (topic) => {
      if (client) {
        return getConversationByTopic(topic, client);
      }
      return undefined;
    },
    [client],
  );

  const getCachedByTopic = useCallback<
    RemoveLastParameter<typeof getCachedConversationByTopic>
  >(async (topic) => getCachedConversationByTopic(topic, db), [db]);

  const getCachedByPeerAddress = useCallback<
    RemoveLastParameter<typeof getCachedConversationByPeerAddress>
  >(
    async (peerAddress) => getCachedConversationByPeerAddress(peerAddress, db),
    [db],
  );

  const getLastMessage = useCallback<
    RemoveLastParameter<typeof _getLastMessage>
  >(async (topic) => _getLastMessage(topic, db), [db]);

  const hasTopic = useCallback<RemoveLastParameter<typeof _hasTopic>>(
    async (topic) => _hasTopic(topic, db),
    [db],
  );

  return {
    getByTopic,
    getCachedByTopic,
    getCachedByPeerAddress,
    getLastMessage,
    hasTopic,
  };
};
