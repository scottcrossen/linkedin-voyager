import {
  ConversationDetails,
  convertMessageUrnToIds,
  convertUrnToId,
  Message,
  MessageDetails,
  SeenDetails,
  Urn,
  UserDetails,
  UserPicture,
} from '../model/api';
const MESSAGE_EVENT = 'com.linkedin.voyager.messaging.event.MessageEvent';
const MEMBER = 'com.linkedin.voyager.messaging.MessagingMember';
const VECTOR_IMAGE = 'com.linkedin.common.VectorImage';

interface RawMemberPhotoContainer {
  [VECTOR_IMAGE]?: {
    artifacts?: {
      width?: string; // Should be a number, but use parseInt to be sure
      height?: string; // Should be a number, but use parseInt to be sure
      fileIdentifyingUrlPathSegment?: string;
      expiresAt?: string;
    }[];
    rootUrl?: string;
  };
}

const parsePhotoDetails = (data: unknown | null): UserPicture[] => {
  const rootUrl = (data as RawMemberPhotoContainer)?.[VECTOR_IMAGE]?.rootUrl;
  if (!rootUrl) {
    return [];
  }
  return ((data as RawMemberPhotoContainer)?.[VECTOR_IMAGE]?.artifacts || [])
    .map((image) => ({
      width: parseInt(image?.width),
      height: parseInt(image?.height),
      expiration: parseInt(image?.expiresAt),
      url: rootUrl + image?.fileIdentifyingUrlPathSegment,
    }))
    .filter((data) => data.width && data.height && data.url && data.expiration);
};

interface RawPlainMemberContainer {
  miniProfile?: {
    objectUrn?: Urn;
    entityUrn?: Urn;
    firstName?: string;
    lastName?: string;
    publicIdentifier?: string;
    picture?: RawMemberPhotoContainer;
  };
}

export const parsePlainUserDetails = (
  data: unknown | null,
): UserDetails | null => {
  const output = {
    memberUrn: (data as RawPlainMemberContainer)?.miniProfile?.objectUrn,
    profileUrn: (data as RawPlainMemberContainer)?.miniProfile?.entityUrn,
    firstName: (data as RawPlainMemberContainer)?.miniProfile?.firstName,
    lastName: (data as RawPlainMemberContainer)?.miniProfile?.lastName,
    publicIdentifier: (data as RawPlainMemberContainer)?.miniProfile
      ?.publicIdentifier,
    picture: parsePhotoDetails(
      (data as RawPlainMemberContainer)?.miniProfile?.picture,
    ),
  };
  if (
    !output.memberUrn ||
    !output.profileUrn ||
    !output.firstName ||
    !output.lastName ||
    !output.publicIdentifier ||
    !output.picture
  ) {
    return null;
  }
  return output;
};

interface RawMemberContainer {
  [MEMBER]?: RawPlainMemberContainer;
}

export const parseUserDetails = (data: unknown | null): UserDetails | null => {
  const output = {
    memberUrn: (data as RawMemberContainer)?.[MEMBER]?.miniProfile?.objectUrn,
    profileUrn: (data as RawMemberContainer)?.[MEMBER]?.miniProfile?.entityUrn,
    firstName: (data as RawMemberContainer)?.[MEMBER]?.miniProfile?.firstName,
    lastName: (data as RawMemberContainer)?.[MEMBER]?.miniProfile?.lastName,
    publicIdentifier: (data as RawMemberContainer)?.[MEMBER]?.miniProfile
      ?.publicIdentifier,
    picture: parsePhotoDetails(
      (data as RawMemberContainer)?.[MEMBER]?.miniProfile?.picture,
    ),
  };
  if (
    !output.memberUrn ||
    !output.profileUrn ||
    !output.firstName ||
    !output.lastName ||
    !output.publicIdentifier ||
    !output.picture
  ) {
    return null;
  }
  return output;
};

interface RawMessageContainer {
  [MESSAGE_EVENT]?: {
    attributedBody?: {
      text?: string;
    };
    subject?: string;
    body?: string;
  };
}

const parseMessage = (data: unknown | null): Message | null => {
  const output = {
    body:
      (data as RawMessageContainer)?.[MESSAGE_EVENT]?.attributedBody?.text ||
      (data as RawMessageContainer)?.[MESSAGE_EVENT]?.body,
    subject: (data as RawMessageContainer)?.[MESSAGE_EVENT]?.subject,
  };
  if (!output.body) {
    return null;
  }
  return output;
};

interface RawMessageDetailsContainer {
  createdAt?: string; // Should be a number, but use parseInt to be sure
  entityUrn?: string;
  eventContent?: RawMessageContainer;
  from?: RawMemberContainer;
  subtype: string; // INMAIL, MEMBER_TO_MEMBER
}

export const parseMessageDetails = (
  data: unknown | null,
): MessageDetails | null => {
  const output = {
    createdAt: parseInt((data as RawMessageDetailsContainer)?.createdAt),
    message: parseMessage((data as RawMessageDetailsContainer)?.eventContent),
    from: parseUserDetails((data as RawMessageDetailsContainer)?.from),
    type: (data as RawMessageDetailsContainer)?.subtype,
    ...convertMessageUrnToIds((data as RawMessageDetailsContainer)?.entityUrn),
  };
  if (
    !output.createdAt ||
    !output.message ||
    !output.from ||
    !output.conversationId ||
    !output.conversationId ||
    !output.type
  ) {
    return null;
  }
  return output;
};

interface RawSeenDetailsContainer {
  fromEntity?: string;
  seenReceipt?: {
    seenAt: string; // Should be a number, but use parseInt to be sure
    eventUrn: string;
  };
  fromParticipant: {
    string: string;
  };
}

export const parseSeenDetails = (data: unknown | null): SeenDetails | null => {
  const output = {
    from: {
      memberUrn: (data as RawSeenDetailsContainer)?.fromParticipant?.string,
      profileUrn: (data as RawSeenDetailsContainer)?.fromEntity,
    },
    ...convertMessageUrnToIds(
      (data as RawSeenDetailsContainer)?.seenReceipt?.eventUrn,
    ),
    seenAt: (data as RawSeenDetailsContainer)?.seenReceipt?.seenAt,
  };
  if (
    !output.seenAt ||
    !output.from.memberUrn ||
    !output.from.profileUrn ||
    !output.messageId ||
    !output.conversationId
  ) {
    return null;
  }
  return output;
};

interface RawConversationDetails {
  lastActivityAt?: string; // Should be a number, but use parseInt to be sure
  entityUrn?: string;
  events?: RawMessageDetailsContainer[]; // Seems to be limited to one message.
  participants?: RawMemberContainer[]; // Does not include self
  receipts?: RawSeenDetailsContainer[];
}

export const parseConversationDetails = (
  data: unknown | null,
): ConversationDetails | null => {
  const output = {
    conversationId: convertUrnToId((data as RawConversationDetails)?.entityUrn),
    lastActivity: parseInt((data as RawConversationDetails)?.lastActivityAt),
    receipts: ((data as RawConversationDetails)?.receipts || [])
      .map(parseSeenDetails)
      .filter((item) => item),
    messages: ((data as RawConversationDetails)?.events || [])
      .map(parseMessageDetails)
      .filter((item) => item),
    participants: ((data as RawConversationDetails)?.participants || [])
      .map(parseUserDetails)
      .filter((item) => item),
  };
  if (
    !output.conversationId ||
    !output.lastActivity ||
    !output.receipts ||
    !output.messages ||
    !output.participants
  ) {
    return null;
  }
  return output;
};
