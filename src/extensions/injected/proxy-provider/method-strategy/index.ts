import { EthSendTransaction } from './eth-send-transaction';
import { EthSign } from './eth-sign';
import { EthSignTypedData } from './eth-sign-typed-data';

export function getMethodStrategy(methodName: string, provider: any) {
  switch (methodName) {
    case 'eth_sendTransaction':
      return new EthSendTransaction(provider);
    case 'eth_sign':
      return new EthSign(provider);
    case 'eth_signTypedData_v3':
    case 'eth_signTypedData_v4':
      return new EthSignTypedData(provider);
    default:
      return null;
  }
}
