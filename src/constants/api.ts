import { ENV } from '@/types/setting';
import { IS_DEV } from '@/utils/dev';

const isLocalServer = false;

export async function getApis(env: ENV) {
  const BASE_URL =
    isLocalServer && IS_DEV
      ? 'http://localhost:5001/kekkai-ba220/asia-northeast1/kekkai'
      : `https://api.kekkai.io/${env === ENV.PRERELEASE ? 'apis-prerelease' : 'apis'}`;

  return {
    FETCH_TOKEN_INFO: `${BASE_URL}/eth/token_info`,
    FETCH_USER_APPROVAL: `${BASE_URL}/eth/token_approval_info`,
    FETCH_APPROVAl_LOGS_COUNT: `${BASE_URL}/eth/approval_logs_count`,
    CHECK_HONEYPOT: `${BASE_URL}/eth/check_honeypot`,
    SIMULATE_TRANSACTION: `${BASE_URL}/eth/simulate_transaction`,
    SETTER_REPORT: `${BASE_URL}/report/report`,
    INCORRECT_FEEDBACK: `${BASE_URL}/feedback/incorrect_feedback`,
    FETCH_NFT_SECURITY: `${BASE_URL}/market/nft_security_info`,
    FETCH_NFT_FLOOR: `${BASE_URL}/market/nft_floor_price`,
    FETCH_CURRENCY_USD: `${BASE_URL}/market/currency_usd_price`,
    CONTRACT_OPEN_SOURCE: `${BASE_URL}/detect_risk/contract_open_source`,
    CONTRACT_OVERSUPPLY_AND_BURN: `${BASE_URL}/detect_risk/contract_oversupply_and_burn`,
    NFT_TRADEABLE_ON_OPENSEA: `${BASE_URL}/detect_risk/nft_tradeable_on_opensea`,
    CHECK_NEW_USER: `${BASE_URL}/refer/service_kekkai_user_stage`,
    ADD_BLACKLIST: `${BASE_URL}/blacklist/add_blacklist`,
  };
}
