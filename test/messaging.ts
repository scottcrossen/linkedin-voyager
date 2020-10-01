import * as chai from 'chai';
import { describe, it } from 'mocha';
import { userDetailsEqual } from '../src/authentication/details';
import { testUsers } from './util';
import * as chaiAsPromised from 'chai-as-promised';
import { MessageDetails } from '../src/model/api';

chai.use(chaiAsPromised);

const expect = chai.expect;

const TEST_MESSAGE = 'This is a test message';

const handleClose = (callback: () => Promise<boolean | void>) => {
  callback().catch((error) =>
    console.error(`Failed to close connection: ${JSON.stringify(error)}`),
  );
};

describe('Messaging', function () {
  this.timeout(1000 * 12);
  it('send/receive messages', async () => {
    let callback1: () => Promise<boolean | void> = () => Promise.resolve(true);
    let cancelTimeout: () => void = () => undefined;
    await new Promise((resolve, reject) =>
      Promise.resolve()
        .then(async () => {
          const [user1, user2] = await testUsers();
          callback1 = await user1.api.messaging.messages(
            (message: MessageDetails) => {
              if (
                message.message.body === TEST_MESSAGE &&
                userDetailsEqual(message.from, user2.userDetails)
              ) {
                resolve();
              }
            },
          );
          const timeout = setTimeout(
            () => reject('Message not received within time.'),
            1000 * 6,
          );
          cancelTimeout = () => clearTimeout(timeout);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await user2.api.messaging.sendToMember(TEST_MESSAGE, [
            user1.userDetails.profileUrn,
          ]);
        })
        .catch(reject),
    )
      .then((result) => {
        handleClose(callback1);
        cancelTimeout();
        return result;
      })
      .catch((error) => {
        handleClose(callback1);
        cancelTimeout();
        expect.fail(JSON.stringify(error));
      });
  });

  it('send/receive seen receipts', async () => {
    let callback1: () => Promise<boolean | void> = () => Promise.resolve(true);
    let callback2: () => Promise<boolean | void> = () => Promise.resolve(true);
    let cancelTimeout: () => void = () => undefined;
    await new Promise((resolve, reject) =>
      Promise.resolve()
        .then(async () => {
          const [user1, user2] = await testUsers();
          callback1 = await user1.api.messaging.messages(
            (message: MessageDetails) =>
              user1.api.messaging
                .markAsSeen(message.conversationId)
                .catch(reject),
          );
          callback2 = await user2.api.messaging.seen(resolve);
          const timeout = setTimeout(
            () => reject('Seen receipt not received within time.'),
            1000 * 6,
          );
          cancelTimeout = () => clearTimeout(timeout);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await user2.api.messaging.sendToMember(TEST_MESSAGE, [
            user1.userDetails.profileUrn,
          ]);
        })
        .catch(reject),
    )
      .then((result) => {
        handleClose(callback1);
        handleClose(callback2);
        cancelTimeout();
        return result;
      })
      .catch((error) => {
        handleClose(callback1);
        handleClose(callback2);
        cancelTimeout();
        expect.fail(JSON.stringify(error));
      });
  });

  it('send/receive typing receipts', async () => {
    let callback1: () => Promise<boolean | void> = () => Promise.resolve(true);
    let callback2: () => Promise<boolean | void> = () => Promise.resolve(true);
    let cancelTimeout: () => void = () => undefined;
    await new Promise((resolve, reject) =>
      Promise.resolve()
        .then(async () => {
          const [user1, user2] = await testUsers();
          callback1 = await user1.api.messaging.messages(
            (message: MessageDetails) =>
              user1.api.messaging
                .markAsTyping(message.conversationId)
                .catch(reject),
          );
          callback2 = await user2.api.messaging.typing(resolve);
          const timeout = setTimeout(
            () => reject('Typing receipt not received within time.'),
            1000 * 6,
          );
          cancelTimeout = () => clearTimeout(timeout);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await user2.api.messaging.sendToMember(TEST_MESSAGE, [
            user1.userDetails.profileUrn,
          ]);
        })
        .catch(reject),
    )
      .then((result) => {
        handleClose(callback1);
        handleClose(callback2);
        cancelTimeout();
        return result;
      })
      .catch((error) => {
        handleClose(callback1);
        handleClose(callback2);
        cancelTimeout();
        expect.fail(JSON.stringify(error));
      });
  });

  it('list conversations and get converation details', async () => {
    await Promise.resolve()
      .then(async () => {
        const [user1, user2] = await testUsers();
        await user1.api.messaging.sendToMember(TEST_MESSAGE, [
          user2.userDetails.profileUrn,
        ]);
        await new Promise((resolve) => setTimeout(resolve, 300));
        const test = await user2.api.messaging.conversations();
        await user2.api.messaging.conversation(test[0].conversationId);
      })
      .catch((error) => {
        expect.fail(JSON.stringify(error));
      });
  });
});
