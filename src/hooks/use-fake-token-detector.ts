import { useEffect, useMemo, useState } from 'react';

import { BlacklistSource, BlacklistStatus, Scam } from '@/types/blacklist';
import { blacklistCollect } from '@/utils/blacklist-accrue';

import { TOKENS_MAP } from '../constants/tokens';
import { ERC20TokenInfo, NftTokenInfo, TokenType } from '../types/eth';
import { emitter } from '../utils/emitter';

export function useFakeTokenDetector(
  chainId: number,
  address?: string,
  tokenInfo?: NftTokenInfo | ERC20TokenInfo,
): {
  isFake: boolean;
} {
  const [isFake, setIsFake] = useState<boolean>(false);

  const sameNameAndSymbolTokens = useMemo(
    () =>
      (TOKENS_MAP[chainId] || []).filter(
        ({ symbol, name }) => symbol === tokenInfo?.symbol && name === tokenInfo?.name,
      ),
    [chainId, tokenInfo?.name, tokenInfo?.symbol],
  );

  useEffect(() => {
    if (tokenInfo?.tokenType !== TokenType.ERC_20) {
      return;
    }

    if (!sameNameAndSymbolTokens.length) {
      return;
    }

    if (!sameNameAndSymbolTokens.some((token) => token.address.toLowerCase() === address?.toLowerCase())) {
      setIsFake(true);
      emitter.emit('fake_token_detection', { isFake: true });
      blacklistCollect({
        address,
        chainId,
        source: BlacklistSource.SYSTEM,
        status: BlacklistStatus.CONFIRMED,
        scamType: Scam.FAKE_TOKEN,
      });
    }
  }, [address, chainId, isFake, sameNameAndSymbolTokens, tokenInfo?.tokenType]);

  return { isFake };
}
