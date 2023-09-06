import { ethErrors } from 'eth-rpc-errors';
import { debounce } from 'lodash-es';

import { sendDocumentMessage } from '@/utils/message';
import { collect } from '@/utils/mixpanel';

import { messageIntercept } from './message-intercept';
import { getMethodStrategy } from './method-strategy';
import { HandlerType } from './type';
import { INTERCEPT_METHODS } from '../const';
import { setting } from '../setting';
import { getAllowlistPass, getChainId } from '../utils';

export class ProxyProvider {
  private provider: any;

  private prevAddress = null;

  private prevChainId: any;

  constructor(private walletName: string) {
    if (!window[walletName] || window[walletName].isKekkai) {
      return;
    }

    this.provider = window[walletName];
    this.proxy();
    messageIntercept(this.executeMethodStrategy);
  }

  private proxy() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    const proxy = new Proxy(
      {},
      {
        get(_target, prop, _receiver) {
          if (['request', 'sendAsync', 'send'].includes(prop as string)) {
            return that.getHandler(prop as HandlerType | 'send');
          }
          return that.provider[prop];
        },
      },
    );

    Object.defineProperty(window, this.walletName, {
      get() {
        return proxy;
      },
      set(_provider) {
        that.provider = _provider;
      },
      configurable: true,
    });

    this.provider.isKekkai = true;
  }

  private handler =
    (method: HandlerType) =>
    async (...args: any[]) => {
      try {
        await this.executeMethodStrategy(method, args);
        return this.provider[method](...args);
      } catch (err) {
        return Promise.reject(err);
      }
    };

  private getHandler(handlerName: HandlerType | 'send') {
    if (handlerName === 'send') {
      return (...args: any[]) => {
        const [method, params] = args;
        if (!params) {
          this.provider.send(...args);
        }
        if (typeof method === 'string') {
          return this.handler('request')({ method, params });
        }
        return this.handler('sendAsync')(method, params);
      };
    } else if (['request', 'sendAsync'].includes(handlerName)) {
      return this.handler(handlerName);
    }
  }

  private handleProviderRequest = debounce(async () => {
    const { provider } = this;
    const address = provider.selectedAddress;
    const chainId = await getChainId(provider);

    if (this.prevAddress !== address || this.prevChainId !== chainId) {
      sendDocumentMessage('USER_ACCOUNT', { address, chainId });
      collect('access_dapp', {
        user: address,
        chainId: String(chainId),
        origin: window.location.origin,
      });
    }

    this.prevAddress = address;
    this.prevChainId = chainId;
  }, 50);

  private executeMethodStrategy = async (type: HandlerType, args: any[]): Promise<void> => {
    const [request, callback] = type === 'request' ? [args[0]] : [args[0], args[1]];
    const { method, params, id } = request;
    const { provider } = this;

    this.handleProviderRequest();

    if (!setting?.enable || !INTERCEPT_METHODS.includes(method)) {
      return;
    }

    const to = method === 'eth_sendTransaction' ? params?.[0]?.to : undefined;
    const allowlistPass = getAllowlistPass(to);

    if (allowlistPass) {
      collect('allowlist_pass', {
        from: provider.selectedAddress,
        chainId: String(await getChainId(provider)),
        origin: window.location.origin,
        address: to,
        allowlistType: allowlistPass.type,
      });
      return;
    }

    try {
      const methodStrategy = getMethodStrategy(method, provider);
      await methodStrategy?.execute(request);
    } catch (err) {
      const error = ethErrors.provider.userRejectedRequest('KEKKAI Tx Signature: User denied transaction signature.');

      if (callback) {
        callback(error, {
          id,
          jsonrpc: '2.0',
          error,
        });
      }
      throw error;
    }
  };
}
