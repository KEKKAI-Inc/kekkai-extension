import { TokenType } from './eth';

export interface Valuation {
  uuid: string;
  type: 1 | -1;
  value: number;
  tokenType?: TokenType;
}

export interface GapSignalRule {
  color: GapSignal;
  percentage: (inputValue: number, outputValue: number) => boolean;
  distance: (inputValue: number, outputValue: number) => boolean;
}

export enum GapSignal {
  PENDING = 'pending',
  SAFE = 'safe',
  RED = 'red',
  YELLOW = 'yellow',
}

export enum PriceStatus {
  PENDING = -2,
  ERROR = -1,
  NODATA = 0,
}
