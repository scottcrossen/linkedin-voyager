import { Session } from '../authentication/sessions';
import { convertUrnToId, DECORATED_EVENT } from '../model/api';
import { HttpMethods } from '../model/methods';
import { CONVERSATION_URL } from '../model/urls';

const TOPIC = 'urn:li-realtime:typingIndicatorsTopic:urn:li-realtime:myself';

export interface TypingDetails {
  from: {
    profileUrn: string; // urn:li:fs_miniProfile:XXXXXXXXXXXXXXX_XXXXXXXXXXXXXXXXXXXXXXX
  };
  conversationId: string;
}

export const listenToTyping = async (
  session: Session,
  handler: (message: TypingDetails) => void,
  includeSelf = false,
): Promise<() => Promise<void>> => {
  const currentUserDetails = !includeSelf ? await session.currentUser() : null;
  return session.listen(
    // @ts-ignore
    /* eslint-disable */ (data: Record<string, any>) /* eslint-enable */ => {
      if (data?.[DECORATED_EVENT]?.topic !== TOPIC) {
        return;
      }
      const message = {
        from: {
          profileUrn: data?.[DECORATED_EVENT]?.payload?.fromEntity,
        },
        conversationId: convertUrnToId(
          data?.[DECORATED_EVENT]?.payload?.conversation,
        ),
      };
      if (!message.from.profileUrn || !message.conversationId) {
        return;
      }
      if (
        !includeSelf &&
        message.from.profileUrn === currentUserDetails.profileUrn
      ) {
        return;
      }
      handler(message);
    },
  );
};

export const sendTypingIndication = async (
  session: Session,
  conversationId: string,
): Promise<void> => {
  await session.fetch(`${CONVERSATION_URL}?action=typing`, {
    method: HttpMethods.Post,
    body: JSON.stringify({ conversationId }),
  });
  return;
};
