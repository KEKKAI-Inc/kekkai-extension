import { ENV, Lang, Setting } from '../types/setting';

export const DEFAULT_SETTING: Setting = {
  enable: true,
  lastDisableTimestamp: 0,
  language: Lang.EN,
  env: ENV.ONLINE,
  allowlist: [],
  nftValuation: true,
};

export const DISABLE_DURATION_LONG = 30 * 60 * 1000; // 30 min