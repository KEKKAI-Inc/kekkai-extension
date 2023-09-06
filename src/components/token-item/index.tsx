import BigNumber from 'bignumber.js';
import React, { useEffect, useMemo, useState } from 'react';

import { CHAIN_INFO } from '@/constants/chain';
import { CURRENCY_LOGO, IMAGE_PATH } from '@/constants/image-path';
import { useFakeTokenDetector } from '@/hooks/use-fake-token-detector';
import { useHoneypotDetector } from '@/hooks/use-honeypot-detector';
import { useSetting } from '@/hooks/use-setting';
import { useTokenTradeableOnOpensea } from '@/hooks/use-token-tradeable-on-opensea';
import { useTokenValue } from '@/hooks/use-token-value';
import { useTranslate } from '@/hooks/use-translate';
import { getDefaultTokenLogo } from '@/pages/defend/utils';
import { ERC20TokenInfo, NftTokenInfo, TokenType } from '@/types/eth';
import { PriceStatus, Valuation } from '@/types/valuation';
import { emitter } from '@/utils/emitter';
import { getTokenInfo } from '@/utils/eth';
import { toFixed } from '@/utils/number';

import './style.scss';

export const TokenItem = React.memo(function ({
  type,
  chainId,
  contract,
  tokenId,
  amount: _amount = 1,
  tokenType,
}: {
  type: -1 | 1;
  chainId: number;
  contract?: string;
  tokenType?: TokenType;
  tokenId?: number;
  amount?: number;
}) {
  const { t } = useTranslate();
  const { setting } = useSetting();

  const [amount, setAmount] = useState<number>();
  const [tokenInfo, setTokenInfo] = useState<NftTokenInfo | ERC20TokenInfo>();
  const [tokenImage, setTokenImage] = useState<string>(getDefaultTokenLogo());

  const { isFake } = useFakeTokenDetector(chainId, contract, tokenInfo);
  const { isHoneypot } = useHoneypotDetector(chainId, contract);
  const { isTradeable } = useTokenTradeableOnOpensea(chainId, contract || '', tokenId);
  const { currencyPriceInUsd, nftPriceInNativeCurrency, fetchNftPriceInNativeCurrency, fetchCurrencyPriceInUsd } =
    useTokenValue({
      chainId,
      tokenInfo,
      contract,
    });

  const isNFT = useMemo(
    () => tokenInfo?.tokenType && [TokenType.ERC_721, TokenType.ERC_1155].includes(tokenInfo?.tokenType),
    [tokenInfo],
  );

  useEffect(() => {
    if (tokenType === TokenType.ETH) {
      const { currency } = CHAIN_INFO[chainId] || 'ETH';
      const logo = CURRENCY_LOGO[currency];
      setTokenInfo({
        tokenType: TokenType.ETH,
        name: currency,
        symbol: currency,
        logo,
        decimals: 1,
      });
      setTokenImage(logo);
      return;
    }

    contract && getTokenInfo(contract, chainId, tokenId).then((info) => setTokenInfo(info));
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
    tokenInfo?.logo && emitter.emit('token_image_load', { type, logo: tokenInfo.logo });
  }, [tokenInfo, type]);

  useEffect(() => {
    isHoneypot && emitter.emit('token_is_honeypot', { isHoneypot });
  }, [isHoneypot]);

  useEffect(() => {
    if (!contract || tokenType !== TokenType.ERC_20) {
      setAmount(toFixed(_amount, 6));
      return;
    }

    if (!tokenInfo) {
      return;
    }

    setAmount(toFixed(_amount / 10 ** (tokenInfo as ERC20TokenInfo).decimals, 6));
  }, [_amount, chainId, contract, tokenInfo, tokenType]);

  useEffect(() => {
    if (
      tokenType === TokenType.UNKNOWN ||
      amount === undefined ||
      currencyPriceInUsd <= 0 ||
      (isNFT && nftPriceInNativeCurrency <= 0)
    ) {
      return;
    }

    const valuation: Valuation = {
      uuid: `${tokenType}${contract}${tokenId}:${amount}`,
      type,
      value: 0,
      tokenType,
    };

    if ((tokenType === TokenType.ERC_20 || tokenType === TokenType.ETH) && currencyPriceInUsd > 0) {
      valuation.value = currencyPriceInUsd * amount;
    }

    if (isNFT) {
      valuation.value = currencyPriceInUsd * nftPriceInNativeCurrency * amount;
    }

    valuation.value && emitter.emit('item_valuation_report', valuation);
  }, [amount, contract, currencyPriceInUsd, isNFT, nftPriceInNativeCurrency, tokenId, tokenType, type]);

  const nftValuation = useMemo(() => {
    if (nftPriceInNativeCurrency === PriceStatus.ERROR || currencyPriceInUsd === PriceStatus.ERROR) {
      return (
        <>
          <span style={{ color: '#F74B5E' }}>&nbsp;{t('defend.error')}&nbsp;</span>
          <span
            onClick={() => {
              nftPriceInNativeCurrency === PriceStatus.ERROR && fetchNftPriceInNativeCurrency();
              currencyPriceInUsd === PriceStatus.ERROR && fetchCurrencyPriceInUsd();
            }}
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
          >
            {t('defend.try_again')}
          </span>
        </>
      );
    }

    if (currencyPriceInUsd === PriceStatus.NODATA || nftPriceInNativeCurrency === PriceStatus.NODATA) {
      return <>&nbsp;{t('defend.item_no_data')}</>;
    }

    if (currencyPriceInUsd === PriceStatus.PENDING || nftPriceInNativeCurrency === PriceStatus.PENDING) {
      return <img className="kekkai-item-loading" alt="" src={IMAGE_PATH.ITEM_LOADING} />;
    }

    return (
      <>
        <img alt="" src={IMAGE_PATH.OPENSEA_SMALL} style={{ width: '16px', height: '16px', margin: '0 4px' }} />
        <span>
          {nftPriceInNativeCurrency}&nbsp;{CHAIN_INFO[chainId].currency}&nbsp;
        </span>
        <span>(${(currencyPriceInUsd * nftPriceInNativeCurrency).toFixed(2)})</span>
      </>
    );
  }, [
    nftPriceInNativeCurrency,
    currencyPriceInUsd,
    chainId,
    t,
    fetchNftPriceInNativeCurrency,
    fetchCurrencyPriceInUsd,
  ]);

  return (
    <div className="kekkai-token-item">
      <div className="kekkai-token-info">
        <img src={tokenImage} className="kekkai-token-logo" alt="" />
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="kekkai-token-symbol">
              {tokenInfo?.symbol || tokenInfo?.name || (tokenInfo as NftTokenInfo)?.collectionName || ''}
            </div>
            {tokenId !== undefined && !isNaN(tokenId) && (
              <div className="kekkai-token-id">
                #{Number(tokenId) > 1000000 ? BigNumber(tokenId).toFixed().slice(0, 5) + '...' : tokenId}
              </div>
            )}
            {!isTradeable && (
              <img
                src={IMAGE_PATH.WARNING_GENERAL}
                alt="question"
                style={{ width: '14px', height: '12px', cursor: 'pointer', marginLeft: '3px' }}
              />
            )}
          </div>

          {isFake && (
            <div style={{ color: '#FF4E4E', fontSize: '10px', display: 'flex', alignItems: 'center' }}>
              <span>{t('defend.fake_token_notification')}</span>
              <img
                src={IMAGE_PATH.WARNING_TRIANGLE}
                alt=""
                style={{ width: '16px', display: 'inline-block', marginLeft: '8px' }}
              />
            </div>
          )}

          {!isTradeable && (
            <div style={{ color: '#F4BF4F', fontSize: '11px' }}>{t('defend.untradeable_token_item')}</div>
          )}

          {isTradeable && setting.nftValuation && isNFT && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>{t('defend.item_value')}:&nbsp;</span>
              {nftValuation}
            </div>
          )}
        </div>
      </div>

      <div className="kekkai-token-amount" style={{ color: type === 1 ? '#61C554' : '#F74B5E' }}>
        {type === 1 ? '+' : '-'}
        {amount || 0}
      </div>
    </div>
  );
});
