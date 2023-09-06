import { BaseExecution } from './base';
import { ExecutionType } from './type';

export class EthSign extends BaseExecution implements ExecutionType {
  constructor(provider: any) {
    super(provider);
  }

  async execute(request: any): Promise<void> {
    const { params } = request;
    return this.showUserPromiseModal({ type: 'sign', user: params[0] });
  }
}
