import axios from 'axios';

import { getApis } from '@/constants/api';

import { BaseExecution } from './base';
import { ExecutionType } from './type';
import { setting } from '../../setting';
import { getChainId, getDefendParamsFromSpecialApi } from '../../utils';

export class EthSendTransaction extends BaseExecution implements ExecutionType {
  constructor(provider: any) {
    super(provider);
  }

  async execute(request: any): Promise<void> {
    const { params } = request;
    const { provider } = this;
    const { from, to, data, value, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas } = params[0];

    if (!to) return;

    const defendParams = getDefendParamsFromSpecialApi({ from, to, data }) || {
      type: 'transaction',
      user: from,
      contract: to,
      target: to,
    };

    if (defendParams.type === 'upgrade_to') {
      try {
        const {
          data: {
            code,
            data: { count },
          },
        } = await axios.get((await getApis(setting.env)).FETCH_APPROVAl_LOGS_COUNT, {
          params: {
            user: from,
            chainId: await getChainId(provider),
            contract: to,
          },
        });

        if (code !== 0 || count <= 0) {
          return;
        }
      } catch (error) {
        return;
      }
    }

    return this.showUserPromiseModal({
      ...defendParams,
      data,
      value,
      gas,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
  }
}
