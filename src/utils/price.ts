import axios from 'axios';

import { getApis } from '@/constants/api';

import { getCache, setCache } from './cache';
import { getEnv } from './setting';

export async function getCurrentPriceInUsd(_currency: string): Promise<number> {
  const currency = _currency.toLocaleUpperCase();
  const cache = await getCache('currentPriceInUsd', currency);

  if (cache) {
    return cache;
  }

  const { data } = await axios.get((await getApis(await getEnv())).FETCH_CURRENCY_USD, {
    params: {
      currency,
    },
  });

  const price = Number(data?.data?.amount);

  setCache('currentPriceInUsd', currency, price, 60 * 60 * 1000);

  return price;
}

export async function getNFT24FloorPriceInNativeCurrency(chainId: number, contract: string) {
  const key = `${chainId}:${contract}`;
  const cache = await getCache('nft24FloorPrice', key);

  if (cache) {
    return cache;
  }

  const { data } = await axios.get((await getApis(await getEnv())).FETCH_NFT_FLOOR, {
    params: {
      chainId,
      contract,
    },
  });

  const price = Number(data.data.price);

  setCache('nft24FloorPrice', key, price, 60 * 60 * 1000);

  return price;
}
