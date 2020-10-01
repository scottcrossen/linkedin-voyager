export const GENERIC_REQUEST_HEADERS = {
  'user-agent': [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5)',
    'AppleWebKit/537.36 (KHTML, like Gecko)',
    'Chrome/83.0.4103.116 Safari/537.36',
  ].join(' '),
  'accept-language': 'en-AU,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  'x-li-lang': 'en_US',
  'x-restli-protocol-version': '2.0.0',
};

export const LOGIN_REQUEST_HEADERS = {
  'x-li-user-agent':
    'LIAuthLibrary:3.2.4 com.linkedin.LinkedIn:8.8.1 iPhone:8.3',
  'user-agent': 'LinkedIn/8.8.1 CFNetwork/711.3.18 Darwin/14.0.0',
  'x-li-lang': 'en_US',
  'x-user-language': 'en',
  'x-user-locale': 'en_US',
  'accept-language': 'en-us',
  accept: 'application/json',
};
