import BigNumber from 'bignumber.js';
import React, { useEffect, useState } from 'react';

import { IMAGE_PATH } from '../../constants/image-path';
import { ERC20TokenInfo, NftTokenInfo, TokenType } from '../../types/eth';
import { emitter } from '../../utils/emitter';
import { getTokenInfo } from '../../utils/eth';
import { toFixed } from '../../utils/number';
import { getDefaultTokenLogo } from '../defend/utils';

import './style.scss';

export function TokenItem({
  type,
  chainId,
  tokenSymbol: _tokenSymbol,
  tokenLogo: _tokenLogo,
  contract,
  tokenId,
  amount: _amount = 1,
  tokenType,
}: {
  type: -1 | 1;
  chainId: number;
  tokenSymbol?: string;
  tokenLogo?: string;
  contract?: string;
  tokenType?: TokenType;
  tokenId?: number;
  amount?: number;
}) {
  const [ amount, setAmount ] = useState<number>();
  const [ tokenInfo, setTokenInfo ] = useState<NftTokenInfo | ERC20TokenInfo>();
  const [ tokenImage, setTokenImage ] = useState<string>(getDefaultTokenLogo());

  useEffect(() => {
    if (tokenType === TokenType.ETH) {
      setTokenInfo({
        tokenType: TokenType.ETH,
        name: 'ETH',
        symbol: 'ETH',
        logo: IMAGE_PATH.ETH_LOGO,
        decimals: 1,
      });
      setTokenImage(IMAGE_PATH.ETH_LOGO);
      return;
    }

    contract && getTokenInfo(contract, chainId, tokenId).then(info => setTokenInfo(info));
  }, [chainId, contract, tokenId, tokenType]);

  useEffect(() => {
    if (tokenType === TokenType.ETH) {
      return;
    }

    let metadataLoaded = false;
    const logo = tokenInfo?.logo;
    if (logo) {
      const image = new Image();
      image.onload = () => {
        !metadataLoaded && setTokenImage(logo);
      };
      image.src = logo;
    }

    const metadataImage = (tokenInfo as NftTokenInfo)?.metadata?.image;
    if (metadataImage) {
      const image = new Image();
      image.onload = () => {
        metadataLoaded = true;
        setTokenImage(metadataImage);
      };
      image.src = metadataImage;
    }
  }, [tokenInfo, tokenType]);

  useEffect(() => {
    emitter.emit('token_image_load', { type, logo: tokenInfo?.logo });
  }, [tokenInfo, type]);

  useEffect(() => {
    if (!contract || tokenType !== TokenType.ERC_20) {
      setAmount(toFixed(_amount, 6));
      return;
    }

    if (!tokenInfo) {
      return;
    }

    setAmount(toFixed(_amount / (10 ** (tokenInfo as ERC20TokenInfo).decimals), 6));
  }, [_amount, chainId, contract, tokenInfo, tokenType]);

  return (
    <div className='kekkai-token-item'>
      <div className='kekkai-token-info'>
        <img src={tokenImage} className='kekkai-token-logo' alt='' />
        <div className='kekkai-token-symbol'>{tokenInfo?.symbol || ''}</div>
        {typeof tokenId === 'number' &&
          <div className='kekkai-token-id'>#{tokenId > 1000000 ? BigNumber(tokenId).toFixed().slice(0, 5) + '...' : tokenId}</div>
        }
      </div>

      <div className='kekkai-token-amount' style={{ color: type === 1 ? '#61C554' : '#F74B5E' }}>
        {type === 1 ? '+' : '-'}{amount || ''}
      </div>
    </div>
  );
}