export interface TipInfo {
  isShow: boolean;
  type: TipType;
  content: string;
}

export enum TipType {
  SUCCESS = 'success',
  ERROR = 'error',
  LOADING = 'loading',
}