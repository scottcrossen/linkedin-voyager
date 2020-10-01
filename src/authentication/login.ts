import { AUTHENTICATE_URL } from '../model/urls';
import { HttpMethods } from '../model/methods';
import { LOGIN_REQUEST_HEADERS } from '../model/headers';
import { Cookies } from './cookies';
import {
  challengeError,
  invalidStatusError,
  invalidDataError,
  unauthorizedError,
} from '../model/errors';
import { Config } from '../base/config';

export const login = async (
  username: string,
  password: string,
  config: Config,
): Promise<Cookies> => {
  const cookieResult = await config.deps.fetch(AUTHENTICATE_URL, {
    headers: LOGIN_REQUEST_HEADERS,
  });
  const cookies = Cookies.fromRaw(cookieResult.headers.raw()['set-cookie']);
  const JSesssionId = cookies.jSessionID();
  const payload: Record<string, string> = {
    session_key: username,
    session_password: password,
    JSESSIONID: `"${JSesssionId}"`,
    //csrfToken: JSesssionId,
    //loginCsrfParam: cookies.bCookie(),
  };
  const requestBody = Object.entries(payload)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  const headers = {
    ...LOGIN_REQUEST_HEADERS,
    cookie: cookies.asHeader(),
    'content-type': 'application/x-www-form-urlencoded',
    'content-length': requestBody.length.toString(),
    //'csrf-token': JSesssionId,
  };
  const fetchResult = await config.deps.fetch(AUTHENTICATE_URL, {
    method: HttpMethods.Post,
    headers,
    body: requestBody,
  });
  const loginCookies = Cookies.fromRaw(fetchResult.headers.raw()['set-cookie']);
  const resultBody = await fetchResult
    .json()
    .catch(() => ({} as Record<string, string>));
  if (resultBody['challenge_url']) {
    return Promise.reject(challengeError(resultBody['challenge_url']));
  } else if (fetchResult.url.match(/challenge/)) {
    return Promise.reject(challengeError(fetchResult.url));
  } else if (fetchResult.status === 401) {
    return Promise.reject(unauthorizedError());
  } else if (fetchResult.status !== 200) {
    return Promise.reject(
      invalidStatusError(AUTHENTICATE_URL, fetchResult.status),
    );
  } else if (loginCookies.isEmpty()) {
    return Promise.reject(invalidDataError({ cookies: loginCookies }));
  } else if (
    !resultBody['login_result'] ||
    resultBody['login_result'] !== 'PASS'
  ) {
    return Promise.reject(invalidDataError(resultBody));
  }
  return Promise.resolve(loginCookies);
};
