import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { getApis } from '@/constants/api';
import { getCache, setCache } from '@/utils/cache';
import { IS_DEV } from '@/utils/dev';
import { getEnv } from '@/utils/setting';

import { emitter } from '../utils/emitter';

export function useMaxSupplyAndBurnDetector(
  chainId: number,
  contract: string,
): {
  isOversupply: boolean;
  isBurn: boolean;
} {
  const [isOversupply, setIsOversupply] = useState<boolean>(false);
  const [isBurn, setIsdBurn] = useState<boolean>(false);

  if (!contract) {
    return { isOversupply, isBurn };
  }

  const handleDetect = useCallback((oversupplyMinting: boolean, privilegedBurn: boolean) => {
    if (oversupplyMinting) {
      setIsOversupply(oversupplyMinting);
      emitter.emit('over_supply_minting_detection', { isOversupply: true });
    }

    if (privilegedBurn) {
      setIsdBurn(privilegedBurn);
      emitter.emit('burn_detection', { isBurn: true });
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const key = `${contract}:${chainId}`;

        if (!IS_DEV) {
          const cache = await getCache('maxSupplyAndBurn', key);

          if (cache !== undefined) {
            const { oversupplyMinting, privilegedBurn } = cache;
            return handleDetect(oversupplyMinting, privilegedBurn);
          }
        }

        const {
          data: {
            data: { oversupplyMinting, privilegedBurn },
          },
        } = await axios.get((await getApis(await getEnv())).CONTRACT_OVERSUPPLY_AND_BURN, {
          params: {
            contract,
            chainId,
          },
        });
        handleDetect(oversupplyMinting, privilegedBurn);
        setCache('maxSupplyAndBurn', key, { oversupplyMinting, privilegedBurn }, 24 * 60 * 60 * 1000);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [chainId, contract, handleDetect]);

  return { isOversupply, isBurn };
}
