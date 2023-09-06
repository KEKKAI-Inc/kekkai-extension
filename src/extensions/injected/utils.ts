import { omit } from 'lodash-es';
import { nanoid } from 'nanoid';
import parse from 'url-parse';

import { AllowlistType } from '@/types/setting';

import { setting } from './setting';
import { DefendParams } from '../../types/defend';
import { TokenType } from '../../types/eth';
import { Risk } from '../../types/risk';
import { addDocumentMessageListener, sendDocumentMessage } from '../../utils/message';

let defendRiskCounter = 0;

export const getChainId = async (ethereumProvider: any) =>
  Number(ethereumProvider.chainId || (await ethereumProvider.request({ method: 'eth_chainId' })));

export function getAllowlistPass(to?: string) {
  return setting.allowlist.find(({ content, type }) => {
    if (type === AllowlistType.WEBSITE) {
      const { protocol, host, pathname } = parse(content.startsWith('http') ? content : 'https://' + content);
      return (
        protocol === window.location.protocol &&
        host.replace(/www\./, '') === window.location.host.replace(/www\./, '') &&
        (pathname === '/' ||
          pathname === '/*' ||
          new RegExp(pathname.replace(/\*/g, '[^\\s]+') + '$').test(window.location.pathname))
      );
    }

    if (type === AllowlistType.ADDRESS && to) {
      return content.toLowerCase() === to.toLowerCase();
    }

    return false;
  });
}

export function showModal(
  params: Omit<DefendParams, 'origin' | 'uuid'> & {
    onConfirm: () => void;
    onCancel: () => void;
  },
) {
  const uuid = nanoid();
  const { onConfirm, onCancel } = params;

  const removeListener = addDocumentMessageListener(
    'USER_STATUS_CHANGE',
    ({ uuid: _uuid, userStatus, risk, defend }) => {
      if (uuid !== _uuid || userStatus === undefined) {
        return;
      }

      removeListener();

      if (userStatus) {
        onConfirm();
        if ([Risk.ALARM, Risk.WARNING].includes(risk)) {
          defendRiskCounter++;
          if (defendRiskCounter === 1 || (defendRiskCounter && defendRiskCounter % 2 === 0)) {
            sendDocumentMessage('INCORRECT_FEEDBACK_SHOW', defend);
          }
        } else {
          defendRiskCounter = 0;
        }
      } else {
        defendRiskCounter = 0;
        onCancel();
      }
    },
  );

  const defendParams: DefendParams = {
    ...omit(params, 'onConfirm', 'onCancel'),
    uuid,
    origin: window.location.host,
    url: window.location.href,
  };

  sendDocumentMessage('SHOW_DEFEND', defendParams);
}

export function getDefendParamsFromSpecialApi({
  from,
  data,
  to,
}: {
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
    const secondParam = data.slice(74, 138);
    const tokenType = secondParam.replace(/f/g, '') === '' ? TokenType.ERC_20 : undefined;
    const tokenIdOrAmount = parseInt(secondParam, 16);

    return {
      type: 'approve',
      user: from,
      target,
      contract: to,
      tokenType,
      tokenId: tokenType !== TokenType.ERC_20 ? tokenIdOrAmount : undefined,
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
    const amount = parseInt(data.slice(-64), 16);

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

  // upgradeTo(address implementation)
  if (/^0x3659cfe6/.test(data)) {
    const target = '0x' + data.slice(34, 74);
    return {
      type: 'upgrade_to',
      user: from,
      target,
      contract: to,
    };
  }
}
