import { Session } from '../authentication/sessions';

export const listenForErrors = async (
  session: Session,
  handler: (data: unknown) => void,
): Promise<() => Promise<void>> => {
  const output = await session.listenForErrors(handler);
  return output;
};
