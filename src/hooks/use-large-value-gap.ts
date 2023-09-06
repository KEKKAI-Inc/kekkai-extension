import { useEffect, useMemo, useRef, useState } from 'react';

import { TokenType } from '@/types/eth';
import { Simulation } from '@/types/simulation';
import { GapSignal, Valuation } from '@/types/valuation';
import { emitter } from '@/utils/emitter';
import { getGapSignal } from '@/utils/gapSignal';

import { useSetting } from './use-setting';

export function useLargeValueGap({ simulation }: { simulation?: Simulation }) {
  const { setting } = useSetting();
  const valuations = useRef<{ [uuid: string]: Valuation }>({});
  const [gapSignal, setGapSignal] = useState<GapSignal>(GapSignal.PENDING);
  const [hasNft, setHasNft] = useState(true);

  useEffect(() => {
    const handler = (obj: Valuation) => {
      valuations.current[obj.uuid] = obj;
      const outputLength = simulation?.output?.length || 0;
      const inputLength = simulation?.input?.length || 0;

      if (!outputLength || !inputLength) {
        setGapSignal(GapSignal.SAFE);
        return;
      }

      if (Object.keys(valuations.current).length !== outputLength + inputLength) {
        return;
      }

      const HAS_NFT = Object.values(valuations.current).some(
        (valuation) => valuation.tokenType === TokenType.ERC_1155 || valuation.tokenType === TokenType.ERC_721,
      );

      if (!HAS_NFT) {
        setHasNft(false);
        return;
      }

      let [inputValue, outputValue] = [0, 0];
      Object.values(valuations.current).forEach(({ value, type }: Valuation) =>
        type === 1 ? (inputValue += value) : (outputValue += value),
      );

      setGapSignal(getGapSignal(inputValue, outputValue));
    };

    emitter.on('item_valuation_report', handler);
    return () => {
      emitter.off('item_valuation_report', handler);
    };
  }, [simulation]);

  const actualGapSignal = useMemo(
    () => (setting.nftValuation && hasNft ? gapSignal : undefined),
    [gapSignal, hasNft, setting.nftValuation],
  );

  return actualGapSignal;
}
