import { CookieJar, Cookies } from './authentication/cookies';
import { Config, Logger } from './base/config';
import * as EventSource from 'eventsource';
import fetch from 'node-fetch';
import { BaseAPI } from './base/api';
import { FileBackedCookiePersistence } from './base/cookie-persistence';
import { TypingDetails } from './messaging/typing_receipts';
import { spawn } from 'child_process';
import * as path from 'path';
import { login } from './authentication/login';
import * as os from 'os';
import { StringDecoder } from 'string_decoder';
import { challengeError, unauthorizedError } from './model/errors';
import {
  ConversationDetails,
  convertIdToConversationUrn,
  convertIdToMemberUrn,
  convertIdToMessageUrn,
  convertIdToProfileUrn,
  convertMessageUrnToIds,
  convertUrnToId,
  Message,
  MessageDetails,
  SeenDetails,
  Urn,
  UrnId,
  UserDetails,
  UserPicture,
} from './model/api';

const checkDependencies = async (): Promise<boolean> => {
  const isWindows = os.platform().indexOf('win') > -1;
  if (
    !(await new Promise((resolve) => {
      let exists = false;
      const spawned = spawn(isWindows ? 'where' : 'whereis', ['python3']);
      spawned.stdout.on('data', () => {
        exists = true;
      });
      spawned.on('error', () => resolve(exists));
      spawned.on('close', () => resolve(exists));
    }))
  ) {
    return false;
  }
  return await new Promise((resolve) => {
    let exists = false;
    const spawned = spawn('python3', [
      '-c',
      `try: from linkedin_api import Linkedin; import click; import os; print('EXISTS')
except ImportError: pass`,
    ]);
    spawned.stdout.on('data', () => {
      exists = true;
    });
    spawned.on('error', () => resolve(exists));
    spawned.on('close', () => resolve(exists));
  });
};

const pythonDependenciesExist = checkDependencies();

const loginViaPythonScript = async (
  username: string,
  password: string,
): Promise<Cookies> => {
  return Cookies.fromRaw(
    await new Promise((resolve, reject) => {
      const rawCookies: string[] = [];
      const spawned = spawn('python3', [
        path.resolve(__dirname, 'login.py'),
        'login',
        '-u',
        username,
        '-p',
        password,
      ]);
      spawned.stdout.on('data', (data) => {
        const output = new StringDecoder('utf8').write(Buffer.from(data));
        console.log(output);
        if (output.match(/CHALLENGE/)) {
          reject(challengeError('python extern'));
        } else if (output.match(/UNAUTHORIZED/)) {
          reject(unauthorizedError());
        } else {
          output
            .split(/\n/)
            .filter((data) => data)
            .forEach((cookie) => rawCookies.push(cookie));
        }
      });
      spawned.on('close', () => resolve(rawCookies));
    }),
  );
};

const defaultConfig: Config = {
  realtimeHealthCheckIntervalMs: 1000,
  cookieJar: new CookieJar(),
  deps: {
    eventSource: (
      url: string,
      eventSourceInitDict?: EventSource.EventSourceInitDict,
    ) => new EventSource(url, eventSourceInitDict),
    fetch: fetch,
  },
  loginOverride: async (
    username: string,
    password: string,
    config: Config,
  ): Promise<Cookies> => {
    if (await pythonDependenciesExist) {
      // Even though the REST requests look the exact same, using python results in less challenges.
      // I spent ~40 hours trying to debug why javascript node-fetch & got dont work as well as python.
      config.log.info('Using python library for requested login.');
      const cookies = await loginViaPythonScript(username, password);
      return cookies;
    } else {
      config.log.warn(
        'Challenge exceptions in the LinkedIn API can be reduced by installing python3 and the linkedin_api python library.',
      );
      const cookies = login(username, password, config);
      return cookies;
    }
  },
  log: {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  },
};

class API extends BaseAPI {
  constructor(readonly username: string, config?: Partial<Config>) {
    super(username, { ...defaultConfig, ...(config || {}) });
  }
}

export {
  API,
  CookieJar,
  Config,
  FileBackedCookiePersistence,
  UserPicture,
  Message,
  ConversationDetails,
  UrnId,
  Urn,
  MessageDetails,
  SeenDetails,
  TypingDetails,
  UserDetails,
  Logger,
  convertUrnToId,
  convertMessageUrnToIds,
  convertIdToProfileUrn,
  convertIdToMemberUrn,
  convertIdToConversationUrn,
  convertIdToMessageUrn,
};
