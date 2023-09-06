import { DefendParams } from '@/types/defend';

import { getChainId, showModal } from '../../utils';

interface BaseExecutionType {
  showUserPromiseModal: (options: Omit<DefendParams, 'origin' | 'uuid'>) => void;
}

export abstract class BaseExecution implements BaseExecutionType {
  constructor(protected provider: any) {}

  async showUserPromiseModal(options: Omit<DefendParams, 'origin' | 'uuid'>) {
    let rs: () => void;
    let rj: () => void;
    const waitUserPromise = new Promise<void>((_resolve, _reject) => ([rs, rj] = [_resolve, _reject]));

    showModal({
      ...options,
      onConfirm: () => {
        rs();
      },
      onCancel: () => {
        rj();
      },
      chainId: await getChainId(this.provider),
    });

    return waitUserPromise;
  }
}
