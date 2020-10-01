import { Session } from '../authentication/sessions';

const PING_EVENT = 'com.linkedin.realtimefrontend.Heartbeat';

export const listenToPing = async (
  session: Session,
  handler: () => void,
): Promise<() => Promise<void>> => {
  return session.listen(
    // @ts-ignore
    /* eslint-disable */ (data: Record<string, any>) /* eslint-enable */ => {
      if (data?.[PING_EVENT]) {
        handler();
      }
    },
  );
};
