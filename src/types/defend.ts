import { TokenType } from './eth';
import { Simulation } from './simulation';

export interface DefendParams {
  user: string;
  type: 'transaction' | 'approve' | 'transfer' | 'sign';
  origin: string;
  favIconUrl?: string;
  chainId?: number;
  tokenType?: TokenType;
  value?: string;
  data?: string;
  contract?: string;
  target?: string;
  tokenId?: number;
  amount?: number;
  tokenIds?: number[];
  amounts?: number[];
  gas?: string;
  uuid: string;
  simulation?: Simulation;
  userStatus?: boolean;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}