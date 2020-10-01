const LRU = require('lru-cache'); // eslint-disable-line

const parseJSessionID = /^[^=]*="(?<value>[^"]*)"$/;
const parseCookie = /^(?<cookie>(?<name>[^=]*)=[^;]*);(?:.(?!Expires=))*.(?:Expires=(?<expiration>[^;]*);)?(?:.(?!Expires=))*$/;
const parseBcookie = /^[^=]*="[^&]*&(?<uuid>[^"]*)"$/;
const MAX_SIZE = 10;

interface CookieMap {
  [name: string]: {
    cookie: string;
    expiration?: string;
  };
}

export interface CookiePersistence {
  read(username: string): Promise<Cookies>;
  write(username: string, cookies: Cookies): Promise<void>;
}

export class Cookies {
  underlying: CookieMap;

  constructor(underlying: CookieMap) {
    this.underlying = underlying;
  }

  static empty(): Cookies {
    return new Cookies({});
  }

  static fromRaw(raw: string[]): Cookies {
    if (!raw || !raw.length) {
      return this.empty();
    }
    return new Cookies(
      raw
        .map((cookie) => {
          const match = cookie.match(parseCookie).groups;
          return [
            match.name,
            { cookie: match.cookie, expiration: match.expiration },
          ];
        })
        .reduce(
          (
            acc: CookieMap,
            val: [string, { cookie: string; expiration: string }],
          ) => {
            acc[val[0]] = val[1];
            return acc;
          },
          {},
        ),
    );
  }

  jSessionID(): string | null {
    return (
      this.underlying['JSESSIONID']?.cookie?.match(parseJSessionID)?.groups
        ?.value || null
    );
  }

  bCookie(): string | null {
    return (
      this.underlying?.bcookie?.cookie?.match(parseBcookie)?.groups?.uuid ||
      null
    );
  }

  asHeader(): string {
    return Object.values(this.underlying)
      .map(({ cookie }) => cookie)
      .join('; ');
  }

  expired(): boolean {
    return (
      this.underlying['JSESSIONID'] &&
      this.underlying['JSESSIONID'].expiration &&
      Date.parse(this.underlying['JSESSIONID'].expiration) < Date.now()
    );
  }

  stringify(): string {
    return JSON.stringify(this.underlying);
  }

  isEmpty(): boolean {
    return !Object.keys(this.underlying).length;
  }

  static parse(raw: string): Cookies {
    return new Cookies(JSON.parse(raw));
  }

  static combine(cookies1: Cookies, cookies2: Cookies): Cookies {
    return new Cookies({ ...cookies1.underlying, ...cookies2.underlying });
  }
}

class LazyCache<T> {
  underlying = new LRU(MAX_SIZE); // LRU<string, Promise<T>>

  get(key: string, loader: () => Promise<T>): Promise<T> {
    return new Promise((resolve) => {
      this.underlying.set(
        key,
        (this.underlying.get(key) || Promise.resolve(null))
          .then(
            (data: T | null): Promise<T> => {
              if (data !== null) {
                return Promise.resolve(data);
              } else {
                return loader();
              }
            },
          )
          .then(
            (data: T): T => {
              resolve(data);
              return data;
            },
          )
          .catch((): null => null),
      );
    });
  }

  set(key: string, newValue: T): Promise<T> {
    this.underlying.set(
      key,
      (this.underlying.get(key) || Promise.resolve(null)).then(
        (): T => newValue,
      ),
    );
    return Promise.resolve(newValue);
  }
}

export class CookieJar {
  underlying: LazyCache<Cookies> = new LazyCache();
  cookiePersistence: CookiePersistence;

  constructor(cookiePersistence?: CookiePersistence) {
    if (!cookiePersistence) {
      this.cookiePersistence = new EphemeralCookiePersistence();
    } else {
      this.cookiePersistence = cookiePersistence;
    }
  }

  async get(username: string): Promise<Cookies | null> {
    let cookies = await this.underlying.get(username, () =>
      this.cookiePersistence.read(username),
    );
    if (cookies.expired()) {
      cookies = Cookies.empty();
      await this.underlying.set(username, cookies);
      await this.cookiePersistence.write(username, cookies);
    }
    return cookies;
  }

  async add(username: string, newCookies: Cookies): Promise<void> {
    const oldCookies = await this.get(username);
    const allCookies = Cookies.combine(oldCookies, newCookies);
    await this.underlying.set(username, allCookies);
    return this.cookiePersistence.write(username, allCookies);
  }

  async clear(username: string): Promise<void> {
    const newCookies = Cookies.empty();
    await this.underlying.set(username, newCookies);
    return this.cookiePersistence.write(username, newCookies);
  }
}

export class EphemeralCookiePersistence implements CookiePersistence {
  write(): Promise<void> {
    return Promise.resolve();
  }

  read(): Promise<Cookies> {
    return Promise.resolve(Cookies.empty());
  }
}
