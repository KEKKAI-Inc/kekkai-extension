export interface Setting {
  enable: boolean;
  lastDisableTimestamp: number;
  language: Lang;
}

export enum Lang {
  EN = 'en',
  JA = 'ja',
}