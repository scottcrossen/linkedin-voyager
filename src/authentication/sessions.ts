import { CookieJar, Cookies } from './cookies';
import { login } from './login';
import { GENERIC_REQUEST_HEADERS } from '../model/headers';
import { ListenerRegistry } from '../realtime/registry';
import {
  Response,
  RequestInit,
  EventSourceInitDict,
  EventSource,
} from '../base/config';
import { REALTIME_URL } from '../model/urls';
import { Config } from '../base/config';
import { invalidStatusError, noPasswordError } from '../model/errors';
import { currentUserDetails } from './details';
import { UserDetails } from '../model/api';

interface FetchContext {
  addDelayAfterGettingCookie: number;
}

const defaultFetchContext = (): FetchContext => {
  return {
    addDelayAfterGettingCookie: 0,
  };
};

export class Session {
  cookieJar: CookieJar;
  userDetails: Promise<UserDetails> | null = null;
  realtimeListeners: ListenerRegistry;

  constructor(
    readonly username: string,
    readonly password: string | null,
    readonly config: Config,
  ) {
    this.cookieJar = config.cookieJar;
    this.realtimeListeners = new ListenerRegistry(async () => {
      return await this.eventSource(REALTIME_URL);
    }, config);
  }

  async cookies(fetchContext = defaultFetchContext()): Promise<Cookies> {
    this.config.log.info('Looking into jar for cookies.');
    let cookies = await this.cookieJar.get(this.username);
    if (cookies.isEmpty() && this.password) {
      this.config.log.info(`Running login flow for '${this.username}'.`);
      cookies = await (this.config.loginOverride
        ? this.config.loginOverride
        : login)(this.username, this.password, this.config);
      this.config.log.info(`Completed login flow for '${this.username}'.`);
      await this.cookieJar.add(this.username, cookies);
      if (fetchContext.addDelayAfterGettingCookie) {
        this.config.log.info('Waiting before proceeding.');
        await new Promise((resolve) =>
          setTimeout(resolve, fetchContext.addDelayAfterGettingCookie),
        );
      }
    } else if (cookies.isEmpty()) {
      this.config.log.error('Cookies empty and no password!');
      return Promise.reject(noPasswordError());
    } else {
      this.config.log.info(
        `Using cookies found in jar for '${this.username}'.`,
      );
    }
    this.config.log.info('Found valid cookies.');
    return cookies;
  }

  currentUser(): Promise<UserDetails> {
    if (!this.userDetails) {
      this.userDetails = currentUserDetails(this);
    }
    return this.userDetails;
  }

  async fetch(
    url: string,
    opt?: RequestInit,
    fetchContext = defaultFetchContext(),
  ): Promise<Response> {
    const handleRedirects = !opt.redirect;
    if (handleRedirects) {
      opt.redirect = 'manual';
    }
    return this.fetchInternal(url, opt, fetchContext)
      .then(async (data) => {
        if (data.status === 302 && handleRedirects) {
          opt.redirect = 'error';
          await this.cookieJar.clear(this.username);
          data = await this.fetchInternal(url, opt, fetchContext);
        }
        return data;
      })
      .then((response) => {
        if (response.status !== 200 && response.status !== 201) {
          return Promise.reject(invalidStatusError(url, response.status));
        } else {
          return Promise.resolve(response);
        }
      });
  }

  private async fetchInternal(
    url: string,
    opt?: RequestInit,
    fetchContext = defaultFetchContext(),
  ): Promise<Response> {
    const cookies = await this.cookies(fetchContext);
    opt.headers = {
      ...GENERIC_REQUEST_HEADERS,
      ...(opt?.headers || {}),
      cookie: cookies.asHeader(),
      'csrf-token': cookies.jSessionID(),
    };
    return this.config.deps.fetch(url, opt);
  }

  async listen(
    listener: (event: Record<string, unknown>) => void,
  ): Promise<() => Promise<void>> {
    return this.realtimeListeners.addEventListener(listener);
  }

  async listenForErrors(
    listener: (event: Record<string, unknown>) => void,
  ): Promise<() => Promise<void>> {
    return this.realtimeListeners.addErrorListener(listener);
  }

  private async eventSource(
    url: string,
    opt?: EventSourceInitDict,
  ): Promise<EventSource> {
    if (!opt) {
      opt = {};
    }
    const cookies = await this.cookies();
    opt.headers = {
      ...GENERIC_REQUEST_HEADERS,
      ...(opt?.headers || {}),
      cookie: cookies.asHeader(),
      'csrf-token': cookies.jSessionID(),
    };
    return this.config.deps.eventSource(url, opt);
  }
}
