const extractIdFromUrn = /^(\S*:){3}(?<urnId>.*)$/;
const extractMessageIds = /^[^(]*\((?<conversationId>[^,]*),(?<messageId>[^)]*)\)$/;
export const DECORATED_EVENT = 'com.linkedin.realtimefrontend.DecoratedEvent';

export type Urn = string;

export type UrnId = string;

export interface UserPicture {
  width: number;
  height: number;
  expiration: number;
  url: string;
}

export interface UserDetails {
  memberUrn: Urn; // urn:li:member:xxxxxxxx
  profileUrn: Urn; // urn:li:fs_miniProfile:XXXXXXXXXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXX
  firstName: string;
  lastName: string;
  publicIdentifier: string;
  picture: UserPicture[];
}

export interface Message {
  subject?: string;
  body: string;
}

export interface MessageDetails {
  conversationId: UrnId;
  messageId: UrnId;
  createdAt: number;
  message: Message;
  from: UserDetails;
  type: string;
}

export interface SeenDetails {
  seenAt: string;
  from: {
    memberUrn: string; // urn:li:member:xxxxxxxx
    profileUrn: string; // urn:li:fs_miniProfile:XXXXXXXXXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXX
  };
  conversationId: UrnId;
  messageId: UrnId;
}

export interface ConversationDetails {
  conversationId: UrnId;
  lastActivity: number;
  receipts: SeenDetails[];
  messages: MessageDetails[];
  participants: UserDetails[];
}

export const convertUrnToId = (urn: Urn): UrnId => {
  return urn.match(extractIdFromUrn).groups.urnId;
};

export const convertMessageUrnToIds = (
  urn: Urn,
): { conversationId: UrnId; messageId: UrnId } => {
  return {
    ...((urn.match(extractMessageIds).groups as unknown) as {
      conversationId: UrnId;
      messageId: UrnId;
    }),
  };
};

export const convertIdToProfileUrn = (profileId: UrnId): Urn => {
  return `urn:li:fs_miniProfile:${profileId}`;
};

export const convertIdToMemberUrn = (memberId: UrnId): Urn => {
  return `urn:li:member:${memberId}`;
};

export const convertIdToConversationUrn = (conversationId: UrnId): Urn => {
  return `urn:li:fs_conversation:${conversationId}`;
};

export const convertIdToMessageUrn = (
  conversationId: UrnId,
  messageId: UrnId,
): Urn => {
  return `urn:li:fs_event:(${conversationId},${messageId})`;
};
