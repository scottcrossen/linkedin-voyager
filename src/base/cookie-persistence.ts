import { CookiePersistence, Cookies } from '../authentication/cookies';
import md5 from 'md5';
import * as fs from 'fs';
import { Logger } from './config';

export class FileBackedCookiePersistence implements CookiePersistence {
  constructor(
    readonly cookieDir: string,
    readonly log: Logger = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    },
  ) {}

  private cookieFile(username: string): string {
    return `${this.cookieDir}/${md5(username)}-cookie.json`;
  }

  async createDirIfNotExists(): Promise<void> {
    await new Promise((resolve, reject) => {
      this.log.info('Checking if cookie directory exists');
      fs.exists(this.cookieDir, (exists) => {
        if (!exists) {
          this.log.info(
            'Cookie directory does not exist. Attempting to create.',
          );
          fs.mkdir(this.cookieDir, (err) => {
            if (!err) {
              this.log.error('Could not create cookie directory.');
              reject(err);
            } else {
              this.log.info('Cookie directory created successfully.');
              resolve(null);
            }
          });
        } else {
          this.log.info('Cookie directory exists.');
          resolve(null);
        }
      });
    });
  }

  async write(username: string, cookies: Cookies): Promise<void> {
    await this.createDirIfNotExists();
    return new Promise((resolve, reject) => {
      this.log.info('Writing cookies to file.');
      fs.writeFile(
        this.cookieFile(username),
        cookies.stringify(),
        (err: unknown) => {
          if (err) {
            this.log.error('Could not write cookies to file.');
            reject(err);
          } else {
            this.log.info('Successfully wrote cookies to file.');
            resolve();
          }
        },
      );
    });
  }

  async read(username: string): Promise<Cookies> {
    await this.createDirIfNotExists();
    return new Promise((resolve, reject) => {
      this.log.info('Reading cookies from file.');
      fs.readFile(
        this.cookieFile(username),
        'utf8',
        (err: unknown, data: string) => {
          if (err) {
            this.log.error(
              'Could not read cookies from file. Attempting to write empty cookies.',
            );
            fs.writeFile(this.cookieFile(username), '{}', (err: unknown) => {
              if (err) {
                this.log.error('Could not write cookies to file.');
                reject(err);
              } else {
                this.log.info('Successfully wrote cookies to file.');
                resolve(Cookies.empty());
              }
            });
          } else {
            this.log.info(
              'Successfully read cookies from file. Attempting to parse',
            );
            try {
              resolve(Cookies.parse(data));
              this.log.info('Successfully parsed cookies.');
            } catch (err) {
              this.log.info('Could not parse cookies.');
              reject(err);
            }
          }
        },
      );
    });
  }
}
