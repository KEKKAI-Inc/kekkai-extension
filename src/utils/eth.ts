import axios from 'axios';
import { omit } from 'lodash-es';
import { ethers, providers } from 'ethers';

import ABI from '../constants/json/abi.json';
import { CHAIN_NAME } from '../constants/chain';
import { ETH_API_KEY } from '../constants/config';
import { TokenType } from '../types/eth';
import { getCache, setCache } from './cache';
import { APIS } from '../constants/api';

function createProvider(chainId: number) {
  return new providers.EtherscanProvider(CHAIN_NAME[chainId], ETH_API_KEY);
}

export function getEnsName(address: string, chainId: number): Promise<string | null> {
  return createProvider(chainId).lookupAddress(address);
}

function generateContractInstance(contract: string, chainId: number) {
  return new ethers.Contract(contract, ABI, createProvider(chainId));
}

export async function getTokenType(contract: string, chainId: number): Promise<TokenType> {
  const cache = await getCache('tokenType', contract);
  if (cache) {
    return cache;
  }

  let tokenType;
  const contractInstance = generateContractInstance(contract, chainId);
  try {
    if (await contractInstance.supportsInterface('0x80ac58cd')) {
      tokenType = TokenType.ERC_721;
    }
    if (await contractInstance.supportsInterface('0xd9b67a26')) {
      tokenType = TokenType.ERC_1155;
    }
  } catch (err) {
    console.log(err);
  }

  tokenType = TokenType.ERC_20;

  setCache('tokenType', contract, tokenType);

  return tokenType;
}

export async function getTokenInfo(contract: string, chainId: number, tokenId?: number) {
  const cacheKey = tokenId !== undefined ? `${contract}:${chainId}:${tokenId}` : `${contract}:${chainId}`;
  const cache = await getCache('tokenInfo', cacheKey);

  if (cache) {
    return cache;
  }

  const { data } = await axios.get(APIS.FETCH_TOKEN_INFO, {
    params: {
      contract,
      chainId,
      tokenId,
    }
  });

  if (tokenId) {
    setCache('tokenInfo', `${contract}:${chainId}`, omit(data.data, 'metadata'), 24 * 60 * 60 * 1000);
  }

  setCache('tokenInfo', cacheKey, data.data, 24 * 60 * 60 * 1000);
  return data.data;
}