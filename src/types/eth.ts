export enum TokenType {
  UNKNOWN = 'unknown',
  ETH = 'eth',
  ERC_20 = 'erc-20',
  ERC_721 = 'erc-721',
  ERC_1155 = 'erc-1155',
}

interface TokenBaseInfo {
  name: string;
  symbol: string;
  logo: string;
  tokenType: TokenType;
}

export interface ERC20TokenInfo extends TokenBaseInfo {
  decimals: number;
}

export interface NftTokenInfo extends TokenBaseInfo {
  totalSupply: number;
  floorPrice: number;
  collectionName: number;
  metadata?: Metadata;
}

interface Metadata {
  image?: string;
  name?: string;
}