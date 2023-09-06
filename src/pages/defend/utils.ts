import { IMAGE_PATH } from '../../constants/image-path';
import { Simulation } from '../../types/simulation';

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

export function checkIsNotSupportedChain(simulation?: Simulation) {
  return simulation?.status === 0 && /not support yet chain id/.test(simulation?.msg || '');
}
