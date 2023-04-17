import { ethErrors } from 'eth-rpc-errors';
import { nanoid } from 'nanoid';

import { TokenType } from '../../types/eth';
import { DefendParams } from '../../types/defend';
import { Setting } from '../../types/setting';
import { addDocumentMessageListener, sendDocumentMessage } from '../../utils/message';
import { DEFAULT_SETTING } from '../../constants/setting';

declare global {
  interface Window {
    [index: string]: any;
    ethereum?: any;
    coinbaseWalletExtension?: any;
  }
}

export let setting: Setting = DEFAULT_SETTING;

addDocumentMessageListener('SETTING_CHANGE', (_) => setting = _);
sendDocumentMessage('GET_SETTING');

function showModal({
  onConfirm,
  onCancel,
  user,
  type,
  contract,
  target,
  tokenId,
  chainId,
  data,
  value,
  gas,
}: Omit<DefendParams, 'origin' | 'uuid'> & {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const uuid = nanoid();
  addDocumentMessageListener('USER_STATUS_CHANGE', ({
    uuid: _uuid,
    userStatus,
  }) => {
    if (uuid !== _uuid || userStatus === undefined) {
      return;
    }
    userStatus ? onConfirm() : onCancel();
  });

  const params: DefendParams = {
    user,
    type,
    contract,
    target,
    tokenId,
    data,
    value,
    gas,
    uuid,
    chainId,
    origin: window.location.host,
  };

  sendDocumentMessage('SHOW_DEFEND', params);
}

function getDefendParamsFromSpecialApi({ from, data, to }: {
  from: string;
  to: string;
  data: string;
}): Omit<DefendParams, 'origin' | 'favIconUrl' | 'uuid' | 'data' | 'gas' | 'value'> | undefined {
  // erc-721、erc-1155
  // setApprovalForAll(address,bool)
  if (/^0xa22cb465/.test(data)) {
    const target = '0x' + data.slice(34, 74);
    const isApprove = data.slice(137, 138) === '1';
    if (isApprove) {
      return {
        type: 'approve',
        user: from,
        contract: to,
        target,
      };
    }
    return;
  }

  // erc-721、erc-20
  // approve(address,uint256)
  if (/^0x095ea7b3/.test(data)) {
    const target = '0x' + data.slice(34, 74);
    const tokenIdOrAmount = parseInt(data.slice(74, 138), 16);

    return {
      type: 'approve',
      user: from,
      contract: to,
      target,
      tokenId: tokenIdOrAmount,
      amount: tokenIdOrAmount,
    };
  }

  // erc-20
  // increaseAllowance(address,uint256)
  if (/^0x39509351/.test(data)) {
    const target = '0x' + data.slice(34, 74);
    const amount = parseInt(data.slice(74, 138), 16);

    return {
      type: 'approve',
      tokenType: TokenType.ERC_20,
      user: from,
      contract: to,
      target,
      amount,
    };
  }

  // erc-721
  // safeTransferFrom(address,address,uint256)
  // safeTransferFrom(address,address,uint256,bytes)
  if (/^0x42842e0e/.test(data) || /^0xb88d4fde/.test(data)) {
    const user = '0x' + data.slice(34, 74);
    const target = '0x' + data.slice(98, 138);
    const tokenId = parseInt(data.slice(138, 202), 16);

    return {
      type: 'transfer',
      tokenType: TokenType.ERC_721,
      user,
      contract: to,
      target,
      tokenId,
    };
  }

  // erc-721、erc-20
  // transferFrom(address,address,uint256)
  if (/^0x23b872dd/.test(data)) {
    const user = '0x' + data.slice(34, 74);
    const target = '0x' + data.slice(98, 138);
    const tokenIdOrAmount = parseInt(data.slice(138, 202), 16);

    return {
      type: 'transfer',
      user,
      contract: to,
      target,
      tokenId: tokenIdOrAmount,
      amount: tokenIdOrAmount,
    };
  }

  // erc-20
  // transfer(address,uint256)
  if (/^0xa9059cbb/.test(data)) {
    const user = from;
    const target = '0x' + data.slice(34, 74);
    const amount = parseInt(data.slice(138, 202), 16);

    return {
      type: 'transfer',
      tokenType: TokenType.ERC_20,
      user,
      contract: to,
      target,
      amount,
    };
  }

  // erc-1155
  // safeTransferFrom(address,address,uint256,uint256,bytes)
  if (/^0xf242432a/.test(data)) {
    const user = '0x' + data.slice(34, 74);
    const target = '0x' + data.slice(98, 138);
    const tokenId = parseInt(data.slice(138, 202), 16);
    const amount = parseInt(data.slice(202, 266), 16);
    return {
      type: 'transfer',
      tokenType: TokenType.ERC_1155,
      user,
      contract: to,
      target,
      tokenId,
      amount,
    };
  }

  // erc-1155
  // safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)
  if (/^0x2eb2c2d6/.test(data)) {

  }
}

function proxyEthereumProvider(ethereumProvider: any, name: string) {
  if (!ethereumProvider || ethereumProvider.isDefending) return;

  async function getRequestAndSendApply(type: 'request' | 'sendAsync', target: any, thisArg: any, args: any[]) {
    const [ request, callback ] = type === 'request' ? [args[0]] : [args[0], args[1]];
    const { method, params, id } = request;

    const showUserPromiseModal = async (options: Omit<DefendParams, 'origin' | 'uuid'>) => {
      try {
        let rs: () => void;
        let rj: () => void;
        const waitUserPromise = new Promise<void>((_rs, _rj) => [rs, rj] = [_rs, _rj]);

        showModal({
          ...options,
          onConfirm: rs!,
          onCancel: rj!,
          chainId: Number(await ethereumProvider.request({ method: 'eth_chainId' })),
        });

        await waitUserPromise;
      } catch (err) {
        const error = ethErrors.provider.userRejectedRequest('Kekkai Tx Signature: User denied transaction signature.');

        if (callback) {
          callback(error, {
            id,
            jsonrpc: '2.0',
            error,
          });
        } else {
          throw error;
        }
      }
    };

    switch (method) {
      case 'eth_sendTransaction': {
        const { from, to, data, value, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = params[0];
        const defendParams = getDefendParamsFromSpecialApi({ from, to, data }) || {
          type: 'transaction',
          user: from,
          contract: to,
          target: to,
        };
        await showUserPromiseModal({
          ...defendParams,
          data,
          value,
          gas,
          gasPrice,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });
        break;
      };
      case 'eth_sign': {
        const user = params[0];
        await showUserPromiseModal({
          type: 'sign',
          user,
        });
        break;
      };
    }

    return Reflect.apply(target, thisArg, args);
  }

  const requestHandler = {
    apply: async (target: any, thisArg: any, args: any[]) => {
      if (!setting?.enable) {
        return Reflect.apply(target, thisArg, args);
      }
      return getRequestAndSendApply('request', target, thisArg, args);
    },  
  };

  const sendAsyncHandler = {
    apply: async (target: any, thisArg: any, args: any[]) => {
      if (!setting?.enable) {
        return Reflect.apply(target, thisArg, args);
      }
      return getRequestAndSendApply('sendAsync', target, thisArg, args);
    },
  };

  const sendHandler = {
    apply: (target: any, thisArg: any, args: any[]) => {
      if (!setting?.enable) {
        return Reflect.apply(target, thisArg, args);
      }

      const [method, params] = args;

      if (typeof method === 'string') {
        return ethereumProvider.request({ method, params });
      }

      if (!params) {
        return Reflect.apply(target, thisArg, args);
      }

      return ethereumProvider.sendAsync(method, params);
    },
  };

  let currentEthereum = ethereumProvider;

  Object.defineProperty(window, name, {
    get() {
      if (!currentEthereum.isDefending) {
        Object.defineProperty(currentEthereum, 'request', { value: new Proxy(currentEthereum.request, requestHandler) });
        Object.defineProperty(currentEthereum, 'sendAsync', { value: new Proxy(currentEthereum.sendAsync, sendAsyncHandler) });
        Object.defineProperty(currentEthereum, 'send', { value: new Proxy(currentEthereum.send, sendHandler) });
        ethereumProvider.isDefending = true;
        currentEthereum.isDefending = true;
      }
      return currentEthereum;
    },
    set(_ethereum) {
      currentEthereum = _ethereum;
    },
    configurable: true,
  });
}

let proxyInterval: NodeJS.Timer;

const proxyAllEthereumProviders = () => {
  if (!window.ethereum) return;
  clearInterval(proxyInterval);

  // Proxy the default window.ethereum provider
  proxyEthereumProvider(window.ethereum, 'ethereum');

  // Proxy any other providers listed on the window.ethereum object
  const altProviders = Object.entries(Object.fromEntries(window.ethereum.providerMap ?? []) ?? {});
  altProviders.forEach(([name, provider], i) => proxyEthereumProvider(provider, `window.ethereum.providers[${i}]`));

  // Proxy the window.coinbaseWalletExtension provider if it exists
  proxyEthereumProvider(window.coinbaseWalletExtension, 'coinbaseWalletExtension');

  // Proxy providers used by Liquality
  const liqualityProviders = ['eth', 'rsk', 'bsc', 'polygon', 'arbitrum', 'fuse', 'avalanche', 'optimism'];
  liqualityProviders.forEach((name) => proxyEthereumProvider(window[name], name));
};

proxyInterval = setInterval(proxyAllEthereumProviders, 100);
proxyAllEthereumProviders();
