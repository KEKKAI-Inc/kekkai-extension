import axios from 'axios';
import { useEffect, useState } from 'react';

import { BlacklistSource, BlacklistStatus, Scam } from '@/types/blacklist';
import { blacklistCollect } from '@/utils/blacklist-accrue';

import { useSetting } from './use-setting';
import { getApis } from '../constants/api';

export function useHoneypotDetector(
  chainId: number,
  contract?: string,
): {
  isHoneypot: boolean;
} {
  const { setting } = useSetting();
  const [isHoneypot, setIsHoneypot] = useState<boolean>(false);

  useEffect(() => {
    if (!contract) {
      return;
    }

    (async () => {
      axios
        .post(
          (await getApis(setting.env)).CHECK_HONEYPOT,
          {
            chainId,
            contract,
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        .then((res) => {
          const { data, code } = res.data;
          if (code === 0) {
            const { status } = data;
            status && setIsHoneypot(status);
          }
        })
        .catch((err) => {
          console.log('[Honeypot Detector]:', err.toString());
        });
    })();
  }, [chainId, contract, setting.env]);

  useEffect(() => {
    isHoneypot &&
      blacklistCollect({
        address: contract,
        chainId,
        source: BlacklistSource.SYSTEM,
        status: BlacklistStatus.PENDING,
        scamType: Scam.HONEYPOT,
      });
  }, [chainId, contract, isHoneypot]);

  return { isHoneypot };
}
