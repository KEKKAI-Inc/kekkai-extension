import { TokenType } from '../types/eth';

export interface TokenItem {
  type: - 1 | 1;
  contract?: string;
  tokenType: TokenType; // eth erc-721 erc-1155 erc-20
  tokenId?: number; // erc-721 erc-1155
  amount: number;
}

export interface Simulation {
  status: 0 | 1;
  gasCost?: number;
  output?: TokenItem[];
  input?: TokenItem[];
  msg?: string;
}
