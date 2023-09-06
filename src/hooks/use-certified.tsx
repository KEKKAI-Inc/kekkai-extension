import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

import CERTIFIED_JSON from '@/constants/json/certified.json';
import { getCache, setCache } from '@/utils/cache';
import { IS_DEV } from '@/utils/dev';
import { getTokenInfo } from '@/utils/eth';

const REMOTE_CERTIFIED_URL =
  'https://firebasestorage.googleapis.com/v0/b/kekkai/o/kekkai%2Fkekkai-json%2Fcertified.json?alt=media&token=bfc5804e-f2dd-40a9-b41c-b140abc2b0b9';

function transformKeyToLower(obj: Record<string, any>): Record<string, any> {
  const tempObj = Object.create(null);
  Object.keys(obj).forEach((key: string) => {
    tempObj[key.toLocaleLowerCase()] = obj[key];
  });
  return tempObj;
}

export function useCertified({
  origin: _origin = '',
  chainId,
  contract = '___NOOP___',
  favIconUrl,
}: {
  origin?: string;
  chainId: number;
  contract?: string;
  favIconUrl?: string;
}): {
  isCertified: boolean;
  name?: string;
  type?: string;
  logo?: string;
} {
  const [certifiedMap, setCertifiedMap] = useState<Record<string, { name: string; type?: string }>>(
    transformKeyToLower(CERTIFIED_JSON),
  );
  const [logo, setLogo] = useState<string | undefined>(favIconUrl);

  useEffect(() => {
    setLogo(favIconUrl);
  }, [favIconUrl]);

  const origin = useMemo(() => {
    const originArr = _origin.split('://');
    return originArr[originArr.length - 1].toLocaleLowerCase();
  }, [_origin]);

  useEffect(() => {
    if (IS_DEV) {
      return;
    }

    (async () => {
      try {
        const cacheKey = 'CERTIFY';
        const cache = await getCache(cacheKey, cacheKey);
        if (cache) {
          setCertifiedMap(cache);
          return;
        }

        const res = await axios.get(REMOTE_CERTIFIED_URL);
        if (Object.keys(res.data).length) {
          const data = transformKeyToLower(res.data);
          setCache(cacheKey, cacheKey, data, 60 * 60 * 1000);
          setCertifiedMap(data);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const certifiedInfo = useMemo(() => {
    return certifiedMap[contract.toLocaleLowerCase()] || certifiedMap[origin];
  }, [certifiedMap, contract, origin]);

  useEffect(() => {
    if (certifiedInfo?.type === 'token') {
      getTokenInfo(contract, chainId)
        .then(({ logo }) => logo && setLogo(logo))
        .catch((err) => console.log(err));
    }
  }, [certifiedInfo, chainId, contract]);

  return {
    isCertified: !!certifiedInfo,
    name: certifiedInfo?.name,
    type: certifiedInfo?.type,
    logo,
  };
}
