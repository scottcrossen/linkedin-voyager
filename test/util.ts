import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { API, UserDetails } from '../src/index.node';

/**
 * Two connected profiles need to be provided for tests. This can be accomplished by using public emails:
 *
 * 1. Get a anonymous email account from https://maildrop.cc/inbox
 * 2. Go through signup flow on LinkedIn.
 * 3. If a phone number is requested use something like https://www.receivesms.org/us-number/3427/
 * 4. Once you hit the 'verify email' screen, navigate to linkedin.com
 * 5. Click "Me" > "Settings & Privacy" > "Account" > "Email addresses" > "Add email address"
 * 6. Get an email from https://getnada.com/#
 * 7. Walk through email verfication
 * 8. Delete old maildrop email
 * 9. Do these steps again and link accounts.
 */
interface Cred {
  username: string;
  password: string;
}

const loadCreds = async (): Promise<[Cred, Cred]> =>
  new Promise((resolve, reject) => {
    fs.readFile(
      path.resolve(__dirname, '..', 'creds.json'),
      'utf8',
      (err: unknown, data: string) => {
        if (err) {
          reject(err);
        } else {
          try {
            resolve(JSON.parse(data) as [Cred, Cred]);
          } catch (err) {
            reject(err);
          }
        }
      },
    );
  });

interface APIUser {
  api: API;
  userDetails: UserDetails;
}

let _testUsers: Promise<[APIUser, APIUser]> | null = null;

export const testUsers = async (): Promise<[APIUser, APIUser]> => {
  if (_testUsers) {
    return _testUsers;
  }
  _testUsers = loadCreds().then(async (creds) => {
    return (await Promise.all(
      creds.map(async (cred: Cred) => {
        const api = new API(cred.username);
        api.setPassword(cred.password);
        return {
          api,
          userDetails: await api.profile
            .me()
            .catch((err) =>
              Promise.reject(
                `Failed getting user details for user ${
                  cred.username
                }: ${JSON.stringify(err)}`,
              ),
            ),
        };
      }),
    )) as [APIUser, APIUser];
  });
  return _testUsers;
};

describe('Creds file', () => {
  it('should exist with values', async () => {
    const creds = await loadCreds();
    expect(creds.length).to.equal(2);
    expect(creds[0].username).to.not.be.null;
    expect(creds[0].password).to.not.be.null;
    expect(creds[1].username).to.not.be.null;
    expect(creds[1].password).to.not.be.null;
  });
});

describe('User details', function () {
  this.timeout(1000 * 6);
  it('should be available', async () => {
    await testUsers().catch((e) => expect.fail(JSON.stringify(e)));
  });
});
