import { Group } from './Group';
import { v4 as uuid } from 'uuid';

export interface GroupMessageContent {
  groupId: string;
  groupMessageId: string;
  defaultAlias?: string;
  participantAddresses: string[];
  payload: string;
}

export const isGroupMessageContent = (
  content: unknown
): content is GroupMessageContent => {
  try {
    const {
      groupId,
      groupMessageId,
      participantAddresses,
      payload,
      defaultAlias,
    } = content as GroupMessageContent;

    // TODO Do some real validation here.
    if (!(typeof groupId === 'string')) return false;
    if (!(typeof groupMessageId === 'string')) return false;
    if (!(typeof payload === 'string')) return false;
    if (!(defaultAlias === undefined || typeof defaultAlias === 'string'))
      return false;
    if (
      !participantAddresses.every((pa) => {
        return (
          typeof pa === 'string' && pa.length === 42 && pa.startsWith('0x')
        );
      })
    ) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const fromGroupAndPayload = (
  group: Group,
  payload: string
): GroupMessageContent => {
  return {
    groupId: group.id,
    defaultAlias: group.defaultAlias,
    groupMessageId: uuid(),
    participantAddresses: group.participantAddresses,
    payload,
  };
};
