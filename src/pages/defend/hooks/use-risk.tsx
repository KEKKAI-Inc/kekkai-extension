import { useMemo } from 'react';

import { useCertified } from '@/hooks/use-certified';
import { DefendParams } from '@/types/defend';
import { Risk } from '@/types/risk';
import { Simulation } from '@/types/simulation';
import { GapSignal } from '@/types/valuation';

import { useSimulationValue } from './use-simulation-value';
import { checkIsNotSupportedChain } from '../utils';

export function useRisk({
  chainId,
  origin,
  target,
  type,
  isFake,
  isHoneypot,
  isTradeable,
  simulation,
  gapSignal,
}: {
  chainId: number;
  origin?: string;
  target?: string;
  type: DefendParams['type'];
  isFake: boolean;
  isTradeable: boolean;
  isHoneypot: boolean;
  simulation?: Simulation;
  gapSignal?: GapSignal;
}) {
  const { isCertified, type: certifiedType } = useCertified({ origin, contract: target, chainId });
  const { inputValue: simulationInputValue, outputValue: simulationOutputValue } = useSimulationValue(
    chainId,
    simulation,
  );

  const risk = useMemo(() => {
    if (simulation) {
      const { status, output, input } = simulation;
      if (checkIsNotSupportedChain(simulation)) {
        return Risk.NONE;
      } else if (isFake) {
        return Risk.WARNING;
      } else if (status === 0) {
        return Risk.ALARM;
      } else if (isHoneypot) {
        return Risk.WARNING;
      } else if (!isTradeable) {
        return Risk.ALARM;
      } else if (!isCertified && output?.length && !input?.length) {
        return Risk.WARNING;
      } else if (!isCertified && simulationInputValue < simulationOutputValue / 1.2) {
        return Risk.ALARM;
      } else if (!isCertified && simulationInputValue < simulationOutputValue / 1.5) {
        return Risk.WARNING;
      } else if (gapSignal) {
        if (gapSignal === GapSignal.PENDING) {
          return Risk.NONE;
        } else if (gapSignal === GapSignal.RED) {
          return Risk.WARNING;
        } else if (certifiedType !== 'marketplace' && gapSignal === GapSignal.YELLOW) {
          return Risk.ALARM;
        }
      }
    } else if (type === 'sign') {
      return Risk.WARNING;
    } else if (type === 'upgrade_to') {
      return Risk.WARNING;
    }

    if (isCertified) {
      return Risk.SAFE;
    }

    return type === 'transaction' ? Risk.NONE : Risk.WARNING;
  }, [
    simulation,
    type,
    isCertified,
    isFake,
    isHoneypot,
    gapSignal,
    simulationInputValue,
    simulationOutputValue,
    isTradeable,
    certifiedType,
  ]);

  return { risk };
}
