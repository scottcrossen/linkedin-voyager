import { Config } from './config';
import { Session } from '../authentication/sessions';
import {
  sendMessageToConversation,
  sendMessageToMembers,
  listenToMessages,
} from '../messaging/messages';
import {
  TypingDetails,
  listenToTyping,
  sendTypingIndication,
} from '../messaging/typing_receipts';
import {
  listenToSeen,
  markConversationAsSeen,
} from '../messaging/seen_receipts';
import { listenToPing } from '../realtime/listen_ping';
import {
  ConversationDetails,
  MessageDetails,
  SeenDetails,
  UrnId,
  UserDetails,
} from '../model/api';
import { getConversation, listConversations } from '../messaging/conversations';
import { listenForErrors } from '../realtime/listen_error';

// TODO: better logging scheme

export class BaseAPI {
  session: Session;

  constructor(readonly username: string, readonly config: Config) {
    this.session = new Session(username, null, config);
  }

  setPassword(password: string): void {
    this.session = new Session(this.username, password, this.config);
  }

  public messaging = {
    sendToConversation: (
      messageBody: string,
      conversationId: UrnId,
    ): Promise<void> =>
      sendMessageToConversation(this.session, messageBody, conversationId),
    sendToMember: (messageBody: string, profileUrns: string[]): Promise<void> =>
      sendMessageToMembers(this.session, messageBody, profileUrns),
    markAsSeen: (conversationId: UrnId): Promise<void> =>
      markConversationAsSeen(this.session, conversationId),
    markAsTyping: (conversationId: string): Promise<void> =>
      sendTypingIndication(this.session, conversationId),
    messages: (
      handler: (message: MessageDetails) => void,
      includeSelf = false,
    ): Promise<() => Promise<void>> =>
      listenToMessages(this.session, handler, includeSelf),
    typing: (
      handler: (message: TypingDetails) => void,
      includeSelf = false,
    ): Promise<() => Promise<void>> =>
      listenToTyping(this.session, handler, includeSelf),
    seen: (
      handler: (message: SeenDetails) => void,
      includeSelf = false,
    ): Promise<() => Promise<void>> =>
      listenToSeen(this.session, handler, includeSelf),
    conversations: async (): Promise<ConversationDetails[]> =>
      listConversations(this.session),
    conversation: async (conversationId: UrnId): Promise<MessageDetails[]> =>
      getConversation(this.session, conversationId),
  };

  public profile = {
    me: (): Promise<UserDetails> => this.session.currentUser(),
  };

  public misc = {
    ping: (handler: () => void): Promise<() => Promise<void>> =>
      listenToPing(this.session, handler),
    errors: (handler: (data: unknown) => void): Promise<() => Promise<void>> =>
      listenForErrors(this.session, handler),
  };
}
