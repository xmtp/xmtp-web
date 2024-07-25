import { useCallback } from "react";
import { getLastMessage as _getLastMessage } from "@/helpers/caching/messages";
import {
  getCachedConversationByTopic,
  getConversationByTopic,
  hasConversationTopic as _hasConversationTopic,
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
  const { getDbInstance } = useDb();

  const saveConversation = useCallback(
    async (conversation: Parameters<typeof _saveConversation>[0]) => {
      if (!client) {
        return undefined;
      }
      const db = await getDbInstance();
      return _saveConversation(conversation, db);
    },
    [client, getDbInstance],
  );

  const updateConversation = useCallback<
    RemoveLastParameter<typeof _updateConversation>
  >(
    async (conversation, update) => {
      const db = await getDbInstance();
      await _updateConversation(conversation, update, db);
    },
    [getDbInstance],
  );

  const updateMetadata = useCallback<
    RemoveLastParameter<typeof updateConversationMetadata>
  >(
    async (conversation, namespace, data) => {
      if (client) {
        const db = await getDbInstance();
        await updateConversationMetadata(
          client.address,
          conversation,
          namespace,
          data,
          db,
        );
      }
    },
    [client, getDbInstance],
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
  const { getDbInstance } = useDb();

  const getByTopic = useCallback(
    async (topic: string) =>
      client ? getConversationByTopic(topic, client) : undefined,
    [client],
  );

  const getCachedByTopic = useCallback(
    async (topic: string) => {
      if (!client) {
        return undefined;
      }
      const db = await getDbInstance();
      return getCachedConversationByTopic(client.address, topic, db);
    },
    [client, getDbInstance],
  );

  const getCachedByPeerAddress = useCallback(
    async (peerAddress: string) => {
      if (!client) {
        return undefined;
      }
      const db = await getDbInstance();
      return getCachedConversationByPeerAddress(
        client.address,
        peerAddress,
        db,
      );
    },
    [client, getDbInstance],
  );

  const getLastMessage = useCallback(
    async (topic: string) => {
      const db = await getDbInstance();
      return _getLastMessage(topic, db);
    },
    [getDbInstance],
  );

  const hasConversationTopic = useCallback(
    async (topic: string) => {
      if (!client) {
        return false;
      }
      const db = await getDbInstance();
      return _hasConversationTopic(client.address, topic, db);
    },
    [client, getDbInstance],
  );

  return {
    getByTopic,
    getCachedByTopic,
    getCachedByPeerAddress,
    getLastMessage,
    hasConversationTopic,
  };
};
