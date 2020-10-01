import { Session } from '../authentication/sessions';
import { DECORATED_EVENT, SeenDetails, UrnId } from '../model/api';
import { HttpMethods } from '../model/methods';
import { CONVERSATION_URL } from '../model/urls';
import { parseSeenDetails } from './parse_response';

const TOPIC = 'urn:li-realtime:messageSeenReceiptsTopic:urn:li-realtime:myself';

export const listenToSeen = async (
  session: Session,
  handler: (message: SeenDetails) => void,
  includeSelf = false,
): Promise<() => Promise<void>> => {
  const currentUserDetails = !includeSelf ? await session.currentUser() : null;
  return session.listen(
    // @ts-ignore
    /* eslint-disable */ (data: Record<string, any>) /* eslint-enable */ => {
      if (data?.[DECORATED_EVENT]?.topic !== TOPIC) {
        return;
      }
      const message = parseSeenDetails(data?.[DECORATED_EVENT]?.payload);
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

export const markConversationAsSeen = async (
  session: Session,
  conversationId: UrnId,
): Promise<void> => {
  await session.fetch(`${CONVERSATION_URL}/${conversationId}`, {
    method: HttpMethods.Post,
    body: JSON.stringify({ patch: { $set: { read: true } } }),
  });
  return;
};
