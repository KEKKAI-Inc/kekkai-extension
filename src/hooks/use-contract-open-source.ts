import axios from 'axios';
import { useEffect, useState } from 'react';

import { getApis } from '@/constants/api';
import { getEnv } from '@/utils/setting';

import { getCache, setCache } from '../utils/cache';
import { IS_DEV } from '../utils/dev';

export function useContractOpenSource({ chainId, contract }: { chainId: number; contract?: string }): {
  openSource: boolean;
} {
  const [openSource, setOpenSource] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const key = `${contract}:${chainId}`;

        if (!IS_DEV) {
          const cache = await getCache('openSource', key);
          if (cache !== undefined) {
            return setOpenSource(cache);
          }
        }

        const {
          data: {
            data: { isOpenSource },
          },
        } = await axios.get((await getApis(await getEnv())).CONTRACT_OPEN_SOURCE, {
          params: {
            contract,
            chainId,
          },
        });
        setOpenSource(isOpenSource);
        setCache('openSource', key, isOpenSource, 24 * 60 * 60 * 1000);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [chainId, contract]);

  return { openSource };
}
