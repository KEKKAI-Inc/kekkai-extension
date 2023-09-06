import { TokenType } from '@/types/eth';
import { Simulation, TokenItem } from '@/types/simulation';

import { BaseExecution } from './base';
import { ExecutionType } from './type';

export class EthSignTypedData extends BaseExecution implements ExecutionType {
  constructor(provider: any) {
    super(provider);
  }

  async execute(request: any): Promise<void> {
    const { params } = request;
    const { provider } = this;
    const user = provider.selectedAddress.toLocaleLowerCase();
    const {
      domain: { name, verifyingContract },
      message,
    } = JSON.parse(params[1]);
    const output: TokenItem[] = [];
    const input: TokenItem[] = [];

    switch (name) {
      case 'Seaport': {
        const { consideration = [], offer } = message;
        const TOKEN_TYPE_MAP: Record<number, TokenType> = {
          0: TokenType.ETH,
          1: TokenType.ERC_20,
          2: TokenType.ERC_721,
          3: TokenType.ERC_1155,
          4: TokenType.ERC_721,
          5: TokenType.ERC_1155,
        };
        consideration.forEach(
          ({
            recipient,
            token,
            startAmount,
            itemType,
            identifierOrCriteria,
          }: {
            token: string;
            itemType: string;
            recipient: string;
            startAmount: string;
            identifierOrCriteria: string;
          }) => {
            if (recipient.toLocaleLowerCase() === user) {
              const amount = Number(startAmount || 0);
              const tokenType = TOKEN_TYPE_MAP[Number(itemType)];
              amount &&
                input.push({
                  type: 1,
                  contract: token,
                  tokenType,
                  amount: tokenType === TokenType.ETH ? amount / 10 ** 18 : amount,
                  tokenId: [TokenType.ERC_721, TokenType.ERC_1155].includes(tokenType)
                    ? Number(identifierOrCriteria || 0)
                    : undefined,
                });
            }
          },
        );

        offer.forEach(
          ({
            startAmount,
            endAmount,
            identifierOrCriteria,
            token,
            itemType,
          }: {
            token: string;
            itemType: string;
            startAmount: string;
            endAmount: string;
            identifierOrCriteria: string;
          }) => {
            const amount = Number(endAmount) || Number(startAmount) || 0;
            const tokenType = TOKEN_TYPE_MAP[Number(itemType)];
            amount &&
              output.push({
                type: -1,
                contract: token,
                tokenType,
                amount: tokenType === TokenType.ETH ? amount / 10 ** 18 : amount,
                tokenId: [TokenType.ERC_721, TokenType.ERC_1155].includes(tokenType)
                  ? Number(identifierOrCriteria || 0)
                  : undefined,
              });
          },
        );
        break;
      }
      case 'LooksRareExchange': {
        const { isOrderAsk, amount, collection, price, minPercentageToAsk, tokenId = 1, currency } = message;
        const nftAmount = Number(amount);
        const nft: Omit<TokenItem, 'type'> = {
          contract: collection,
          tokenType: nftAmount > 1 ? TokenType.ERC_1155 : TokenType.ERC_721,
          amount: nftAmount,
          tokenId: Number(tokenId),
        };
        const token: Omit<TokenItem, 'type'> = {
          contract: currency,
          tokenType: TokenType.ERC_20,
          amount: Number(price) * (Number(minPercentageToAsk) / 10000),
        };

        if (isOrderAsk) {
          nft.amount && output.push({ ...nft, type: -1 });
          token.amount && input.push({ ...token, type: 1 });
        } else {
          token.amount && output.push({ ...token, type: -1 });
          nft.amount && input.push({ ...nft, type: 1 });
        }
        break;
      }
      case 'Blur Exchange': {
        const { collection, amount, tokenId, fees, paymentToken, price, side } = message;
        if (!collection || !paymentToken) {
          break;
        }

        const nftAmount = Number(amount);
        const nft: Omit<TokenItem, 'type'> = {
          contract: collection,
          tokenType: nftAmount > 1 ? TokenType.ERC_1155 : TokenType.ERC_721,
          amount: nftAmount,
          tokenId: Number(tokenId),
        };
        const reduceRate = fees?.reduce((prev: number, curr: { rate: string }) => prev + Number(curr.rate), 0);
        const isEth = Number(paymentToken) === 0;
        const token: Omit<TokenItem, 'type'> = {
          contract: paymentToken,
          tokenType: isEth ? TokenType.ETH : TokenType.ERC_20,
          amount: (Number(price) * ((10000 - reduceRate) / 10000)) / (isEth ? 1e18 : 1),
        };

        if (Number(side) === 1) {
          nft.amount && output.push({ ...nft, type: -1 });
          token.amount && input.push({ ...token, type: 1 });
        } else {
          token.amount && output.push({ ...token, type: -1 });
          nft.amount && input.push({ ...nft, type: 1 });
        }
        break;
      }
    }

    if (output.length || input.length) {
      const simulation: Simulation = {
        status: 1,
        input,
        output,
      };

      return this.showUserPromiseModal({
        type: 'sign',
        user,
        target: verifyingContract,
        simulation,
      });
    }
  }
}
