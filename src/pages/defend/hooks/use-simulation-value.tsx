import { useEffect, useState } from 'react';

import { NftTokenInfo, TokenType } from '../../../types/eth';
import { Simulation } from '../../../types/simulation';
import { getTokenInfo } from '../../../utils/eth';
import { getSimulationInputEthValue } from '../../../utils/simulation';

export function useSimulationValue(
  chainId: number,
  simulation?: Simulation,
): {
  inputValue: number;
  outputValue: number;
} {
  const [inputValue, setInputValue] = useState<number>(0);
  const [outputValue, setOutputValue] = useState<number>(0);

  useEffect(() => {
    if (!simulation?.input?.length) {
      return;
    }

    setInputValue(getSimulationInputEthValue(simulation));
  }, [simulation]);

  useEffect(() => {
    if (!simulation?.output?.length) {
      return;
    }

    const outputNftList = simulation?.output.filter(
      ({ tokenType, contract }) => [TokenType.ERC_721, TokenType.ERC_1155].includes(tokenType) && contract,
    );
    const priceGetterPromises = outputNftList.map(({ contract }) =>
      getTokenInfo(contract!, chainId),
    ) as Promise<NftTokenInfo>[];

    let _value = 0;
    Promise.allSettled(priceGetterPromises)
      .then((results) => {
        results.forEach(({ status, value }: any) => {
          if (status === 'fulfilled' && value.floorPrice) {
            _value += value.floorPrice;
          }
        });
        setOutputValue(_value);
      })
      .catch((err) => console.log(err));
  }, [chainId, simulation?.output]);

  return { inputValue, outputValue };
}
