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
  const { getInstance } = useDb();

  const saveConversation = useCallback(
    async (conversation: Parameters<typeof _saveConversation>[0]) => {
      if (!client) {
        return undefined;
      }
      const db = await getInstance();
      return _saveConversation(conversation, db);
    },
    [client, getInstance],
  );

  const updateConversation = useCallback<
    RemoveLastParameter<typeof _updateConversation>
  >(
    async (conversation, update) => {
      const db = await getInstance();
      await _updateConversation(conversation, update, db);
    },
    [getInstance],
  );

  const updateMetadata = useCallback<
    RemoveLastParameter<typeof updateConversationMetadata>
  >(
    async (conversation, namespace, data) => {
      if (client) {
        const db = await getInstance();
        await updateConversationMetadata(
          client.address,
          conversation,
          namespace,
          data,
          db,
        );
      }
    },
    [client, getInstance],
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
  const { getInstance } = useDb();

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
      const db = await getInstance();
      return getCachedConversationByTopic(client.address, topic, db);
    },
    [client, getInstance],
  );

  const getCachedByPeerAddress = useCallback(
    async (peerAddress: string) => {
      if (!client) {
        return undefined;
      }
      const db = await getInstance();
      return getCachedConversationByPeerAddress(
        client.address,
        peerAddress,
        db,
      );
    },
    [client, getInstance],
  );

  const getLastMessage = useCallback(
    async (topic: string) => {
      const db = await getInstance();
      return _getLastMessage(topic, db);
    },
    [getInstance],
  );

  const hasConversationTopic = useCallback(
    async (topic: string) => {
      if (!client) {
        return false;
      }
      const db = await getInstance();
      return _hasConversationTopic(client.address, topic, db);
    },
    [client, getInstance],
  );

  return {
    getByTopic,
    getCachedByTopic,
    getCachedByPeerAddress,
    getLastMessage,
    hasConversationTopic,
  };
};
