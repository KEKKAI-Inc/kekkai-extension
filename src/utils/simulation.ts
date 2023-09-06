import axios from 'axios';

import { getApis } from '@/constants/api';
import { TokenType } from '@/types/eth';
import { Simulation } from '@/types/simulation';

import { getCache, setCache } from './cache';
import { getEnv } from './setting';

export interface Tx {
  chainId: number;
  from: string;
  to: string;
  value: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export function setTransactionSimulateResultsCache(
  { from, to, value, data, gas, chainId }: Tx,
  simulateResult: Simulation,
) {
  setCache('txSimulateResult', `${from}:${to}:${value}:${data}:${gas}:${chainId}`, simulateResult, 60 * 1000);
}

export function getTransactionSimulateResultsCache({ from, to, value, data, gas, chainId }: Tx) {
  return getCache('txSimulateResult', `${from}:${to}:${value}:${data}:${gas}:${chainId}`);
}

export function getSimulationInputEthValue(simulation: Simulation) {
  return simulation.input?.find(({ tokenType }) => tokenType === TokenType.ETH)?.amount || 0;
}

export async function fetchSimulation(tx: Tx): Promise<Simulation> {
  try {
    const res = await axios.post((await getApis(await getEnv())).SIMULATE_TRANSACTION, tx, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const { data, code, msg } = res.data;
    return code === -1 ? { status: 0, msg } : data ? data : { status: 0, msg: 'Network error, try again later' };
  } catch (err) {
    return {
      status: 0,
      msg: (err as any).message,
    };
  }
}
