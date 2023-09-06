// import axios from 'axios';

import BLACKLIST from '@/constants/json/blacklist.json';
import FUZZYLIST from '@/constants/json/fuzzylist.json';
import WHITELIST from '@/constants/json/whitelist.json';
import browser from '@/polyfill/browser';

// import { IS_DEV } from './dev';
// import { getCache, setCache } from './cache';

// const REMOTE_SCAM_LIST_URL: Record<string, string> = {
//   whitelist:
//     'https://firebasestorage.googleapis.com/v0/b/kekkai/o/kekkai%2Fkekkai-json%2Fwhitelist.json?alt=media&token=d1f73709-6ad9-4e6f-9333-d8898681ac77',
//   blacklist:
//     'https://firebasestorage.googleapis.com/v0/b/kekkai/o/kekkai%2Fkekkai-json%2Fblacklist.json?alt=media&token=2935efc7-f42e-4449-a162-657b24639cf9',
//   fuzzylist:
//     'https://firebasestorage.googleapis.com/v0/b/kekkai/o/kekkai%2Fkekkai-json%2Ffuzzylist.json?alt=media&token=674df1ef-707d-4004-ac88-b22ede8e5199',
// };

export const getUserProceedScam = async (): Promise<Record<string, number>> => {
  const { userProceedScam } = await browser.storage.local.get('userProceedScam');
  if (!userProceedScam) {
    return {};
  }
  return { ...userProceedScam };
};

export const setUserProceedScam = async (args: Record<string, number>) => {
  const userProceedScam = await getUserProceedScam();
  return browser.storage.local.set({
    userProceedScam: { ...userProceedScam, ...args },
  });
};

export async function getScamDetectorList() {
  const scamDetectorList: Record<string, string[]> = {
    whitelist: WHITELIST,
    blacklist: BLACKLIST,
    fuzzylist: FUZZYLIST,
  };

  /**
   *   Obtaining the list from the cache takes too long.
   */

  // if (!IS_DEV) {
  //   try {
  //     for (const key of Object.keys(REMOTE_SCAM_LIST_URL)) {
  //       const cacheKey = 'SCAM' + key.toLocaleUpperCase();
  //       const cache = await getCache(cacheKey, cacheKey);
  //       if (cache && cache.length) {
  //         scamDetectorList[key] = cache;
  //         continue;
  //       }

  //       const res = await axios.get(REMOTE_SCAM_LIST_URL[key]);
  //       if (res.data.length) {
  //         setCache(cacheKey, cacheKey, res.data, 60 * 60 * 1000);
  //         scamDetectorList[key] = res.data;
  //       }
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
  return scamDetectorList;
}
