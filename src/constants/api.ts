const isLocalServer = false;

const BASE_URL = isLocalServer && process.env.NODE_ENV === 'development'
  ? 'http://localhost:5001/unismart-fc274/us-central1/kekkai'
  : 'https://us-central1-unismart-fc274.cloudfunctions.net/kekkai';

export const APIS = {
  SIMULATE_TRANSACTION: `${BASE_URL}/eth/simulate_transaction`,
  FETCH_TOKEN_INFO: `${BASE_URL}/eth/token_info`,
}