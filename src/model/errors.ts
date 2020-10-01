export enum ErrorTypes {
  Challenge = 'Challenge exception encountered at login',
  InvalidData = 'Unknown data returned',
  Unauthorized = 'Invalid login or restricted account',
  InvalidStatus = 'Invalid status code',
  AccountBlocked = 'Account has been blocked',
  NoPassword = 'Password has not been supplied and cookies have expired.',
  DepedencyError = 'A depedency threw an error',
}

export interface Error {
  type: ErrorTypes;
  data: unknown;
}

export const challengeError = (url: string): Error => {
  return {
    type: ErrorTypes.Challenge,
    data: {
      url,
    },
  };
};

export const invalidDataError = (data: unknown): Error => {
  return {
    type: ErrorTypes.InvalidData,
    data,
  };
};

export const unauthorizedError = (): Error => {
  return {
    type: ErrorTypes.Unauthorized,
    data: {},
  };
};

export const invalidStatusError = (url: string, status: number): Error => {
  return {
    type: ErrorTypes.InvalidStatus,
    data: {
      url,
      status,
    },
  };
};

export const accountBlockedError = (): Error => {
  return {
    type: ErrorTypes.AccountBlocked,
    data: {},
  };
};

export const noPasswordError = (): Error => {
  return {
    type: ErrorTypes.NoPassword,
    data: {},
  };
};

export const depedencyError = (err: unknown): Error => {
  return {
    type: ErrorTypes.NoPassword,
    data: {
      error: err,
    },
  };
};
