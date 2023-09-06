import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { DefendParams } from '@/types/defend';
import { getDefend, listenDefendChange } from '@/utils/defend';
import { IS_WEB } from '@/utils/platform';
import { Tx, fetchSimulation } from '@/utils/simulation';
import { parseQuery } from '@/utils/url';

import Defend from './Defend';

export default function DefendContainer() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [defend, setDefend] = useState<DefendParams>();

  const updateDefendInWebPlatform = useCallback(async () => {
    const {
      chain_id = 1,
      detect_website: origin = '',
      tx_from: from,
      tx_to: to,
      tx_value: value = '0x0',
      tx_data: data = '0x',
      tx_gas: gas,
      callback,
    } = parseQuery(search);

    if (!from || !to) {
      return;
    }

    const tx: Tx = {
      chainId: Number(chain_id),
      from: (from as string).toLocaleLowerCase(),
      to: (to as string).toLocaleLowerCase(),
      value: value as string,
      data: data as string,
      gas: gas as string,
    };
    const simulationPromise = fetchSimulation(tx);
    const defend: DefendParams = {
      uuid: 'open-component',
      type: 'transaction',
      origin: origin as string,
      user: from as string,
      target: to as string,
      callback: callback as string,
    };

    setDefend(defend);

    const simulation = await simulationPromise;

    setDefend((prev) => ({
      ...prev!,
      simulation,
    }));
  }, [search]);

  useEffect(() => {
    if (IS_WEB) {
      updateDefendInWebPlatform();
      return;
    }

    const defendHandler = (defend?: DefendParams) => {
      if (defend && defend.userStatus === undefined) {
        setDefend(defend);
      } else {
        navigate('/');
      }
    };

    getDefend()
      .then(defendHandler)
      .catch((err) => console.error(err));
    const removeListener = listenDefendChange(async (_, defend) => defendHandler(defend));
    return removeListener;
  }, [navigate, updateDefendInWebPlatform]);

  if (!defend) {
    return null;
  }

  return <Defend {...defend} />;
}
