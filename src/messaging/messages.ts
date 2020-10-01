import { Session } from '../authentication/sessions';
import {
  convertUrnToId,
  DECORATED_EVENT,
  MessageDetails,
  Urn,
  UrnId,
} from '../model/api';
import { HttpMethods } from '../model/methods';
import { CONVERSATION_URL } from '../model/urls';
import { parseMessageDetails } from './parse_response';

const TOPIC = 'urn:li-realtime:messagesTopic:urn:li-realtime:myself';

export const listenToMessages = async (
  session: Session,
  handler: (message: MessageDetails) => void,
  includeSelf = false,
): Promise<() => Promise<void>> => {
  const currentUserDetails = !includeSelf ? await session.currentUser() : null;
  return session.listen(
    // @ts-ignore
    /* eslint-disable */ (data: Record<string, any>) /* eslint-enable */ => {
      if (data?.[DECORATED_EVENT]?.topic !== TOPIC) {
        return;
      }
      const message = parseMessageDetails(
        data?.[DECORATED_EVENT]?.payload?.event,
      );
      if (
        !message ||
        (!includeSelf &&
          message.from.profileUrn === currentUserDetails.profileUrn)
      ) {
        return;
      }
      handler(message);
    },
  );
};

export const sendMessageToConversation = async (
  session: Session,
  messageBody: string,
  conversationId: UrnId,
): Promise<void> => {
  await session.fetch(
    `${CONVERSATION_URL}/${conversationId}/events?action=create`,
    {
      method: HttpMethods.Post,
      body: JSON.stringify(constructMessage(messageBody)),
    },
  );
  return;
};

export const sendMessageToMembers = async (
  session: Session,
  messageBody: string,
  profileUrns: Urn[],
): Promise<void> => {
  const body = {
    conversationCreate: {
      ...constructMessage(messageBody),
      recipients: profileUrns.map(convertUrnToId),
      subtype: 'MEMBER_TO_MEMBER',
    },
    keyVersion: 'LEGACY_INBOX',
  };

  await session.fetch(`${CONVERSATION_URL}?action=create`, {
    method: HttpMethods.Post,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return;
};

const constructMessage = (messageBody: string): Record<string, unknown> => {
  return {
    eventCreate: {
      value: {
        'com.linkedin.voyager.messaging.create.MessageCreate': {
          body: messageBody,
          attachments: [],
          attributedBody: { text: messageBody, attributes: [] },
          mediaAttachments: [],
        },
      },
    },
  };
};
