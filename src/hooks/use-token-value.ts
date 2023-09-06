import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSetting } from './use-setting';
import { CHAIN_INFO } from '../constants/chain';
import { ERC20TokenInfo, NftTokenInfo, TokenType } from '../types/eth';
import { PriceStatus } from '../types/valuation';
import { getCurrentPriceInUsd, getNFT24FloorPriceInNativeCurrency } from '../utils/price';

export function useTokenValue({
  chainId = 1,
  contract,
  tokenInfo,
}: {
  chainId: number;
  contract?: string;
  tokenInfo?: NftTokenInfo | ERC20TokenInfo;
}): {
  currencyPriceInUsd: PriceStatus | number;
  nftPriceInNativeCurrency: PriceStatus | number;
  fetchNftPriceInNativeCurrency: () => Promise<void>;
  fetchCurrencyPriceInUsd: () => Promise<void>;
} {
  const { setting } = useSetting();
  const [currencyPriceInUsd, setCurrencyPriceInUsd] = useState<PriceStatus | number>(PriceStatus.PENDING);
  const [nftPriceInNativeCurrency, setNftPriceInNativeCurrency] = useState<PriceStatus | number>(PriceStatus.PENDING);

  const isNFT = useMemo(
    () => [TokenType.ERC_721, TokenType.ERC_1155].includes(tokenInfo?.tokenType as TokenType),
    [tokenInfo],
  );

  const fetchCurrencyPriceInUsd = useCallback(async () => {
    setCurrencyPriceInUsd(PriceStatus.PENDING);
    const currency = isNFT ? CHAIN_INFO[chainId].currency : tokenInfo?.symbol || CHAIN_INFO[chainId].currency;

    try {
      const price = await getCurrentPriceInUsd(currency === 'WETH' ? 'ETH' : currency);
      setCurrencyPriceInUsd(price || PriceStatus.NODATA);
    } catch (err) {
      setCurrencyPriceInUsd(PriceStatus.ERROR);
    }
  }, [chainId, isNFT, tokenInfo]);

  const fetchNftPriceInNativeCurrency = useCallback(async () => {
    if (!setting.nftValuation || !contract || !isNFT) {
      return;
    }

    setNftPriceInNativeCurrency(PriceStatus.PENDING);

    try {
      const price = await getNFT24FloorPriceInNativeCurrency(chainId, contract);
      setNftPriceInNativeCurrency(price || PriceStatus.NODATA);
    } catch (err) {
      setNftPriceInNativeCurrency(PriceStatus.ERROR);
    }
  }, [chainId, contract, isNFT, setting.nftValuation]);

  useEffect(() => {
    fetchCurrencyPriceInUsd();
    fetchNftPriceInNativeCurrency();
  }, [fetchNftPriceInNativeCurrency, fetchCurrencyPriceInUsd]);

  return {
    currencyPriceInUsd,
    nftPriceInNativeCurrency,
    fetchNftPriceInNativeCurrency,
    fetchCurrencyPriceInUsd,
  };
}
