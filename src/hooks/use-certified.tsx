import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import CERTIFIED_JSON from '../constants/json/certified.json';
import { getCache, setCache } from '../utils/cache';

const REMOTE_CERTIFIED_URL = 'https://firebasestorage.googleapis.com/v0/b/unismart-fc274.appspot.com/o/kekkai%2Fcertified.json?alt=media&token=ed2399bd-b80c-4b5c-9a7b-1c93cdc2e91c';

function transformKeyToLower(obj: Record<string, any>): Record<string, any> {
  const tempObj = Object.create(null);
  Object.keys(obj).forEach((key: string) => {
    tempObj[key.toLocaleLowerCase()] = obj[key];
  });
  return tempObj;
}

export function useCertified({
  origin: _origin,
  contract = '___NOOP___',
}: {
  origin: string;
  contract?: string;
}) {
  const [ certifiedMap, setCertifiedMap ] = useState<Record<string, { name: string }>>(transformKeyToLower(CERTIFIED_JSON));

  const origin = useMemo(() => {
    const originArr = _origin.split('://');
    return originArr[originArr.length - 1].toLocaleLowerCase();
  }, [_origin]);

  useEffect(() => {
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

  const isCertified = useMemo(() => {
    return !!(certifiedMap[origin] || certifiedMap[contract.toLocaleLowerCase()]);
  }, [certifiedMap, contract, origin]);

  const certifiedName = useMemo(() => {
    return (certifiedMap[origin] || certifiedMap[contract.toLocaleLowerCase()])?.name;
  }, [certifiedMap, contract, origin]);

  return { isCertified, certifiedName };
}