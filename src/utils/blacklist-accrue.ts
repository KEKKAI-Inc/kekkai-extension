import axios from 'axios';

import { getApis } from '@/constants/api';
import { BlacklistSource, BlacklistStatus, Scam } from '@/types/blacklist';

import { getEnv } from './setting';

interface BlacklistInfo {
  address?: string;
  chainId?: number;
  website?: string;
  source: BlacklistSource;
  status: BlacklistStatus;
  relatedAddress?: string[];
  relatedWebsite?: string[];
  scamType?: Scam;
  reason?: string;
}

export async function blacklistCollect(blacklistInfo: BlacklistInfo) {
  axios.post((await getApis(await getEnv())).ADD_BLACKLIST, blacklistInfo);
}
