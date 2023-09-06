import axios from 'axios';
import { useEffect, useState } from 'react';

import { getApis } from '@/constants/api';
import { getCache, setCache } from '@/utils/cache';
import { IS_DEV } from '@/utils/dev';
import { getEnv } from '@/utils/setting';

import { emitter } from '../utils/emitter';

export function useTokenTradeableOnOpensea(
  chainId: number,
  contract: string,
  tokenId?: number,
): {
  isTradeable: boolean;
} {
  const [isTradeable, setIsTradeable] = useState<boolean>(true);

  if (!contract || tokenId === undefined) {
    return { isTradeable };
  }

  useEffect(() => {
    (async () => {
      try {
        const key = `${contract}:${tokenId}:${chainId}`;

        if (!IS_DEV) {
          const cache = await getCache('tradeableOnOpensea', key);
          if (cache !== undefined) {
            const { suspicious } = cache;
            return setIsTradeable(!suspicious);
          }
        }

        const {
          data: {
            data: { suspicious },
          },
        } = await axios.get((await getApis(await getEnv())).NFT_TRADEABLE_ON_OPENSEA, {
          params: {
            contract,
            chainId,
            tokenId,
          },
        });

        setIsTradeable(!suspicious);
        setCache('tradeableOnOpensea', key, { suspicious }, 24 * 60 * 60 * 1000);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [chainId, contract, tokenId]);

  useEffect(() => {
    if (!isTradeable) {
      emitter.emit('tradeable_detection', { isTradeable });
    }
  }, [isTradeable]);

  return { isTradeable };
}
