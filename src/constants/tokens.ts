import MAINNET from '../constants/json/tokens/mainnet.json';
import OPTIMISM from '../constants/json/tokens/optimism.json';
import BSC from '../constants/json/tokens/bsc.json';
import POLYGON from '../constants/json/tokens/polygon.json';
import ARBITRUM from '../constants/json/tokens/arbitrum.json';
import CELO from '../constants/json/tokens/celo.json';

export const TOKENS_MAP: Record<number, {
  name: string;
  symbol: string;
  address: string;
}[]> = {
  1: MAINNET,
  10: OPTIMISM,
  56: BSC,
  137: POLYGON,
  42161: ARBITRUM,
  42220: CELO,
};
