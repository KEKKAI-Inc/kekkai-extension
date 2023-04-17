import { IMAGE_PATH } from '../../constants/image-path';
import { Simulation } from '../../types/simulation';
import { getCache, setCache } from '../../utils/cache';

export function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

let getDefaultTokenLogoTime = -1;
export function getDefaultTokenLogo(): string {
  getDefaultTokenLogoTime++;
  return IMAGE_PATH.TOKEN_LOGO_DEFAULT[getDefaultTokenLogoTime % IMAGE_PATH.TOKEN_LOGO_DEFAULT.length];
}

interface Tx {
  from: string;
  to: string;
  value: string;
  data: string;
  gas?: string;
  chainId: number;
}

export function setTransactionSimulateResultsCache({
  from,
  to,
  value,
  data,
  gas,
  chainId,
}: Tx, simulateResult: Simulation) {
  setCache('txSimulateResult', `${from}:${to}:${value}:${data}:${gas}:${chainId}`, simulateResult, 60 * 1000);
}

export function getTransactionSimulateResultsCache({
  from,
  to,
  value,
  data,
  gas,
  chainId,
}: Tx) {
  return getCache('txSimulateResult', `${from}:${to}:${value}:${data}:${gas}:${chainId}`);
}