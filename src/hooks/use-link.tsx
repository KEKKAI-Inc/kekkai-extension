import axios from 'axios';
import { useEffect, useState } from 'react';
import LINKS_JSON from '../constants/json/link.json';
import { getCache, setCache } from '../utils/cache';

const REMOTE_LINK_URL = 'https://firebasestorage.googleapis.com/v0/b/unismart-fc274.appspot.com/o/kekkai%2Flink.json?alt=media&token=a92456f5-a4a3-4910-b47d-d6e67e98b1c1';

export function useLink() {
  const [ links, setLinks ] = useState<Record<string, string>>(LINKS_JSON);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    (async () => {
      try {
        const cacheKey = 'LINK';
        const cache = await getCache(cacheKey, cacheKey);
        if (cache) {
          setLinks(cache);
          return;
        }

        const res = await axios.get(REMOTE_LINK_URL);
        if (Object.keys(res.data).length) {
          setCache(cacheKey, cacheKey, res.data, 60 * 60 * 1000);
          setLinks(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return { links };
}