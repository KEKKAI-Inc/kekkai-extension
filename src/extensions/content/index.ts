import axios from 'axios';

import { getApis } from '@/constants/api';
import LINKS_JSON from '@/constants/json/link.json';
import browser from '@/polyfill/browser';
import { DefendParams } from '@/types/defend';
import { Setting } from '@/types/setting';
import { getDefend, setDefend, setDefendSimulation } from '@/utils/defend';
import { PhishingDetector } from '@/utils/detector';
import { getTokenApprovalInfo } from '@/utils/eth';
import { addDocumentMessageListener, sendDocumentMessage } from '@/utils/message';
import { collect, init } from '@/utils/mixpanel';
import { getScamDetectorList } from '@/utils/scam-detector';
import { getUserProceedScam, setUserProceedScam } from '@/utils/scam-detector';
import { getEnv, getSetting, listenSettingChange } from '@/utils/setting';
import {
  Tx,
  fetchSimulation,
  getTransactionSimulateResultsCache,
  setTransactionSimulateResultsCache,
} from '@/utils/simulation';
import { getUserAccount, setUserAccount } from '@/utils/user';

init();

/***** INJECT SCRIPT START *****/
function addScript(url: string) {
  const container = document.head || document.documentElement;
  const scriptTag = document.createElement('script');
  scriptTag.setAttribute('async', 'false');
  scriptTag.setAttribute('src', browser.runtime.getURL(url));
  container.appendChild(scriptTag);
  scriptTag.onload = () => scriptTag.remove();
}
addScript('injected.bundle.js');
addScript('feedback.bundle.js');
/***** INJECT SCRIPT END *****/

/***** SCAN DETECTOR START *****/
(async function () {
  const { host, href: url } = window.location;
  const userProceedScamTime = (await getUserProceedScam())[host];
  const user = await getUserAccount();

  if (userProceedScamTime && Date.now() - userProceedScamTime <= 2 * 60 * 60 * 1000) {
    if (Date.now() - userProceedScamTime <= 5 * 1000) {
      setTimeout(() => {
        sendDocumentMessage('INCORRECT_FEEDBACK_SHOW', {
          from: user.address || '',
          type: 'scam_warning_web',
          url,
        });
      }, 2000);
    }
    return;
  }

  const { whitelist, blacklist, fuzzylist } = await getScamDetectorList();
  const { result, type } = new PhishingDetector({
    tolerance: 2,
    whitelist,
    fuzzylist,
    blacklist,
  }).check(host);

  if (result) {
    collect('scam_warning', {
      from: user.address || '',
      origin: host,
      status: 'intercept',
      reason: type,
      source: 'web',
    });
    window.location.href = `${LINKS_JSON.scam_detector}#hostname=${host}&href=${url}`;
  }

  addDocumentMessageListener('SCAM_WARNING_PROCEED', (args: any) => {
    setUserProceedScam({ [args.scamHostname]: args.timestamp });
    collect('scam_warning', {
      from: user.address || '',
      origin: args.scamHostname,
      status: 'proceed',
      reason: type,
      source: 'web',
    });
  });
})();
/***** SCAN DETECTOR END *****/

/***** DEFEND START *****/
addDocumentMessageListener('SHOW_DEFEND', async (params: DefendParams) => {
  const {
    uuid,
    chainId = 1,
    user,
    target,
    contract,
    value = '0x0',
    data,
    gas,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = params;

  if (!(await getDefend())) {
    axios.post((await getApis(await getEnv())).CHECK_NEW_USER, { address: user, stage: 2 });
  }

  setDefend(params);

  browser.runtime.sendMessage({ event: 'SHOW_DEFEND', data: { uuid } });

  if (params.type === 'transaction' && target) {
    const tx: Tx = {
      from: user.toLocaleLowerCase(),
      to: target.toLocaleLowerCase(),
      value,
      data,
      gas,
      chainId,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    try {
      getTransactionSimulateResultsCache(tx)
        .then((cache) => cache && setDefendSimulation(uuid, cache))
        .catch((err) => console.error(err));
    } catch (err) {
      // ...
    }

    const simulation = await fetchSimulation(tx);
    setDefendSimulation(uuid, simulation);
    setTransactionSimulateResultsCache(tx, simulation);
  }

  if (params.type === 'upgrade_to' && contract) {
    getTokenApprovalInfo(user, chainId, contract)
      .then((tokenApproveInfo) => {
        setDefendSimulation(uuid, {
          status: 1,
          output: tokenApproveInfo,
        });
      })
      .catch(() => {
        setDefendSimulation(uuid, {
          status: 1,
        });
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
        const { uuid, userStatus, risk } = changes.defend?.newValue;
        sendDocumentMessage('USER_STATUS_CHANGE', { uuid, userStatus, risk, defend: changes.defend?.newValue });
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

/***** USER ACCOUNT START *****/
addDocumentMessageListener('USER_ACCOUNT', (args: { address: string }) => setUserAccount(args));
/***** USER ACCOUNT END *****/
