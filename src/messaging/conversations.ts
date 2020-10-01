import { CONVERSATION_URL } from '../model/urls';
import { Session } from '../authentication/sessions';
import { HttpMethods } from '../model/methods';
import { ConversationDetails, MessageDetails, Urn, UrnId } from '../model/api';
import { invalidDataError } from '../model/errors';
import {
  parseConversationDetails,
  parseMessageDetails,
} from './parse_response';

export const getConversation = async (
  session: Session,
  conversationId: UrnId,
): Promise<MessageDetails[]> => {
  const result = await session.fetch(
    `${CONVERSATION_URL}/${conversationId}/events`,
    {
      method: HttpMethods.Get,
    },
  );
  const json = ((await result.json().catch(invalidDataError)) as unknown) as {
    elements?: unknown[];
  };
  return (json?.elements || []).map(parseMessageDetails).filter((item) => item);
};

export const listConversations = async (
  session: Session,
): Promise<ConversationDetails[]> => {
  const result = await session.fetch(
    `${CONVERSATION_URL}?keyVersion=LEGACY_INBOX`,
    {
      method: HttpMethods.Get,
    },
  );
  const json = ((await result.json().catch(invalidDataError)) as unknown) as {
    elements: { entityUrn: Urn; lastActivityAt: number }[];
  };
  return (json?.elements || [])
    .map(parseConversationDetails)
    .filter((item) => item);
};
