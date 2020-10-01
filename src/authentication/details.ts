import { PROFILE_DETAILS } from '../model/urls';
import { Session } from './sessions';
import { HttpMethods } from '../model/methods';
import { invalidDataError } from '../model/errors';
import { UserDetails } from '../model/api';
import { parsePlainUserDetails } from '../messaging/parse_response';

export const userDetailsEqual = (
  userDetails1: UserDetails,
  userDetails2: UserDetails,
): boolean => {
  return (
    userDetails1.memberUrn === userDetails2.memberUrn &&
    userDetails1.profileUrn === userDetails2.profileUrn &&
    userDetails1.firstName === userDetails2.firstName &&
    userDetails1.lastName === userDetails2.lastName
  );
};

export const currentUserDetails = async (
  session: Session,
): Promise<UserDetails> => {
  const response = await session.fetch(
    `${PROFILE_DETAILS}`,
    {
      method: HttpMethods.Get,
      headers: {
        'accept-encoding': 'gzip, deflate, sdch, br',
      },
    },
    { addDelayAfterGettingCookie: 300 },
  );
  /* eslint-disable */
  // @ts-ignore
  const data = ((await response.json()) as any) as Record<
    string,
    Record<string, string>
  >;
  const output = parsePlainUserDetails(data);
  if (!output) {
    return Promise.reject(invalidDataError({ profile: data }));
  }
  return output;
};
