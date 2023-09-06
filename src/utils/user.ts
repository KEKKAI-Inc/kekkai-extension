import { isEqual } from 'lodash-es';

import browser from '@/polyfill/browser';
import { UserAccount } from '@/types/user';

export const getUserAccount = async (): Promise<UserAccount> => {
  const { userAccount } = await browser.storage.local.get('userAccount');
  return { ...userAccount };
};

export const setUserAccount = async (args: Partial<UserAccount>) => {
  const userAccount = await getUserAccount();
  if (!isEqual(userAccount, args)) {
    return browser.storage.local.set({ userAccount: args });
  }
};
