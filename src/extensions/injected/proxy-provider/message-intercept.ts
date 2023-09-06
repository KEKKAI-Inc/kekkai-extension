import { ProxyProvider } from './index';

let hasIntercepted = false;
let originPostMessage: (...args: any[]) => void = window.postMessage;

export function messageIntercept(executeMethodStrategy: ProxyProvider['executeMethodStrategy']) {
  if (hasIntercepted) {
    return;
  }

  Object.defineProperty(window, 'postMessage', {
    get() {
      return async (...args: any[]) => {
        if (args.length > 0 && typeof args[0].data === 'object') {
          const { data } = args[0].data;
          if (data && !data.id && !data.jsonrpc) {
            await executeMethodStrategy('request', [data]);
          }
        }
        return originPostMessage(...args);
      };
    },
    set(postMessage) {
      originPostMessage = postMessage;
    },
    configurable: true,
  });

  hasIntercepted = true;
}
