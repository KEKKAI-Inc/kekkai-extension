import axios from 'axios';
import browser from 'webextension-polyfill';

import { Setting } from '../../types/setting';
import { APIS } from '../../constants/api';
import { setDefend, setDefendSimulation } from '../../utils/defend';
import { getSetting, listenSettingChange } from '../../utils/setting';
import { sendDocumentMessage, addDocumentMessageListener } from '../../utils/message';

import { DefendParams } from '../../types/defend';
import {
  getTransactionSimulateResultsCache,
  setTransactionSimulateResultsCache,
} from '../../components/defend/utils';


/***** INJECT SCRIPT START *****/
var s = document.createElement('script');
s.src = browser.runtime.getURL('injectedScript.bundle.js');
s.onload = () => {
  s.remove();
};
(document.head || document.documentElement).appendChild(s);
/***** INJECT SCRIPT END *****/


/***** DEFEND START *****/
addDocumentMessageListener('SHOW_DEFEND', (params: DefendParams) => {
  setDefend(params);

  const {
    uuid,
    chainId = 1,
    user,
    target,
    value = '0x0',
    data,
    gas,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = params;

  browser.runtime.sendMessage({ event: 'SHOW_DEFEND', data: { uuid } });

  if (params.type === 'transaction' && target && data) {
    const tx = {
      from: user,
      to: target,
      value,
      data,
      gas,
      chainId,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
    try {
      getTransactionSimulateResultsCache(tx).then(cache => cache && setDefendSimulation(uuid, cache));
    } catch(err) {
      // ...
    }
    axios.post(APIS.SIMULATE_TRANSACTION, tx).then(res => {
      const { data, code, msg } = res.data;
      const simulation = code === -1
        ? { status: 0, msg }
        : data;
      setDefendSimulation(uuid, simulation);
      setTransactionSimulateResultsCache(tx, simulation);
    });
  }
});

browser.storage.onChanged.addListener((changes: Record<string, any>, area: string) => {
  if (area !== 'local') {
    return;
  }

  if (changes.defend?.oldValue && changes.defend?.newValue) {
    if (changes.defend?.oldValue.uuid === changes.defend?.newValue.uuid) {
      if (changes.defend?.newValue.userStatus !== undefined) {
        const { uuid, userStatus } = changes.defend?.newValue;
        sendDocumentMessage('USER_STATUS_CHANGE', { uuid, userStatus });
      }
    } else {
      sendDocumentMessage('USER_STATUS_CHANGE', { uuid: changes.defend?.oldValue.uuid, userStatus: false });
    }
  }
});
/***** DEFEND END *****/


/***** SETTING START *****/
const sendSettingChange = (setting: Setting) => sendDocumentMessage('SETTING_CHANGE', setting);
listenSettingChange(sendSettingChange);
addDocumentMessageListener('GET_SETTING', () => getSetting().then(sendSettingChange));
/***** SETTING END *****/
