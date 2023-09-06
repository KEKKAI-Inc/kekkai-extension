import { init } from '@/utils/mixpanel';

import { ProxyProvider } from './proxy-provider';

declare global {
  interface Window {
    [index: string]: any;
  }
}

init();

let proxyInterval: NodeJS.Timer;

function proxyProvider() {
  if (!window.ethereum) return;
  clearInterval(proxyInterval);

  new ProxyProvider('ethereum');
  new ProxyProvider('coinbaseWalletExtension');
  // Proxy providers used by Liquality
  const providerNames = ['eth', 'rsk', 'bsc', 'polygon', 'arbitrum', 'fuse', 'avalanche', 'optimism'];
  providerNames.forEach((name) => new ProxyProvider(name));
}

proxyProvider();
proxyInterval = setInterval(proxyProvider, 50);
setTimeout(() => clearInterval(proxyInterval), 60 * 1000);
