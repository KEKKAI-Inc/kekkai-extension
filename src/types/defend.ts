import { TokenType } from './eth';
import { Risk } from './risk';
import { Simulation } from './simulation';

export interface DefendParams {
  uuid: string;
  user: string;
  type: 'transaction' | 'approve' | 'transfer' | 'sign' | 'upgrade_to';
  target?: string;
  origin?: string;
  favIconUrl?: string;
  chainId?: number;
  tokenType?: TokenType;
  value?: string;
  data?: string;
  contract?: string;
  tokenId?: number;
  amount?: number;
  tokenIds?: number[];
  amounts?: number[];
  gas?: string;
  simulation?: Simulation;
  userStatus?: boolean;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  url?: string;
  risk?: Risk;
  callback?: string; // open component callback link
}
