import axios from 'axios';
import { providers } from 'ethers';
import { omit } from 'lodash-es';

import { getApis } from '@/constants/api';
import { CHAIN_INFO } from '@/constants/chain';
import { ETH_API_KEY } from '@/constants/config';
import { ERC20TokenInfo, NftTokenInfo } from '@/types/eth';

import { getCache, setCache } from './cache';
import { getEnv } from './setting';

function createProvider(chainId: number) {
  const chainInfo = CHAIN_INFO[chainId];
  if (!chainInfo) {
    return;
  }
  return new providers.EtherscanProvider(chainInfo.name, ETH_API_KEY);
}

export function getEnsName(address: string, chainId: number): Promise<string | null> | undefined {
  return createProvider(chainId)?.lookupAddress(address);
}

export async function getTokenInfo(
  contract: string,
  chainId: number,
  tokenId?: number,
): Promise<NftTokenInfo | ERC20TokenInfo> {
  const key = tokenId !== undefined ? `${contract}:${chainId}:${tokenId}` : `${contract}:${chainId}`;
  const cache = await getCache('tokenInfo', key);

  if (cache) {
    return cache;
  }

  const { data } = await axios.get((await getApis(await getEnv())).FETCH_TOKEN_INFO, {
    params: {
      contract,
      chainId,
      tokenId,
    },
  });

  if (tokenId !== undefined) {
    setCache('tokenInfo', `${contract}:${chainId}`, omit(data.data, 'metadata'), 24 * 60 * 60 * 1000);
  }

  setCache('tokenInfo', key, data.data, 24 * 60 * 60 * 1000);
  return data.data;
}

export async function getTokenApprovalInfo(user: string, chainId: number, contract: string) {
  const key = `${user}:${chainId}:${contract}`;
  const cache = await getCache('tokenApproveInfo', key);

  if (cache) {
    return cache;
  }

  const { data } = await axios.get((await getApis(await getEnv())).FETCH_USER_APPROVAL, {
    params: {
      user,
      chainId,
      contract,
    },
  });

  setCache('tokenApproveInfo', key, data.data, 24 * 60 * 60 * 1000);
  return data.data;
}
