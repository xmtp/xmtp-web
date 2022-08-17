import { GroupMessage } from './GroupMessage';
import { v4 as uuid } from 'uuid';

export interface Group {
  id: string;
  defaultAlias?: string;
  participantAddresses: string[];
}

export const fromGroupMessage = (message: GroupMessage): Group => {
  return {
    id: message.content.groupId,
    defaultAlias: message.content.defaultAlias,
    participantAddresses: message.content.participantAddresses,
  };
};

export const fromPeerAddresses = (peerAddresses: string[]): Group => {
  return {
    id: uuid(),
    participantAddresses: peerAddresses,
  };
};

export const withDefaultAlias = (group: Group, defaultAlias: string): Group => {
  return { ...group, defaultAlias };
};
