export interface Setting {
  enable: boolean;
  lastDisableTimestamp: number;
  language: Lang;
  env: ENV;
  allowlist: Allowlist[];
  nftValuation: boolean;
}

export enum Lang {
  EN = 'en',
  JA = 'ja',
}

export enum ENV {
  ONLINE = 'online',
  PRERELEASE = 'prerelease',
}

export interface Allowlist {
  content: string;
  type: AllowlistType;
  createTime: number;
}

export enum AllowlistType {
  ADDRESS = 'Address',
  WEBSITE = 'Website',
}