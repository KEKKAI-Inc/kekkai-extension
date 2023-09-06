import axios from 'axios';
import { useEffect, useState } from 'react';

import LINKS_JSON from '../constants/json/link.json';
import { getCache, setCache } from '../utils/cache';
import { IS_DEV } from '../utils/dev';

const REMOTE_LINK_URL =
  'https://firebasestorage.googleapis.com/v0/b/kekkai/o/kekkai%2Fkekkai-json%2Flink.json?alt=media&token=0c0e6f93-7925-4333-92a6-e34912f73fd6';

export function useLink() {
  const [links, setLinks] = useState<Record<string, string>>(LINKS_JSON);

  useEffect(() => {
    if (IS_DEV) {
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
          setLinks((prev) => {
            const next = { ...prev, ...res.data };
            setCache(cacheKey, cacheKey, next, 60 * 60 * 1000);
            return next;
          });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return { links };
}
