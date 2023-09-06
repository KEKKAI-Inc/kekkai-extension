import LINKS_JSON from '@/constants/json/link.json';
import { DISABLE_DURATION_LONG } from '@/constants/setting';
import browser from '@/polyfill/browser';
import { Lang } from '@/types/setting';
import { listenDefendChange, setDefendFavIconUrl, setDefendUserStatus } from '@/utils/defend';
import { init } from '@/utils/mixpanel';
import { listenSettingChange, setSetting } from '@/utils/setting';

init();

/***** INSTALL START *****/
browser.runtime.onInstalled.addListener((object) => {
  if (object.reason === 'install') {
    const browserLang = browser.i18n.getUILanguage();

    chrome.tabs.create({ url: LINKS_JSON['introduction'] });

    browser.runtime.setUninstallURL(LINKS_JSON.survey_en);

    browserLang.includes('ja') && setSetting({ language: Lang.JA });
  }
});
/***** INSTALL END *****/

/***** INJECT SCRIPT START *****/
if (browser.scripting) {
  browser.scripting
    .unregisterContentScripts()
    .then(() => {
      const scripts = [
        {
          id: 'kekkai-script',
          matches: ['file://*/*', 'http://*/*', 'https://*/*'],
          js: ['injected.bundle.js', 'feedback.bundle.js'],
          allFrames: true,
          runAt: 'document_start',
          world: 'MAIN',
        },
      ];
      browser.scripting.registerContentScripts(scripts as any);
    })
    .catch((err) => {
      console.error(err);
    });
}
/***** INJECT SCRIPT END *****/

/***** SETTING START *****/
let enableRecoverTimer: NodeJS.Timer | undefined;
listenSettingChange(({ enable, lastDisableTimestamp, language }) => {
  if (!enable && lastDisableTimestamp) {
    enableRecoverTimer && clearTimeout(enableRecoverTimer);
    enableRecoverTimer = setTimeout(() => {
      setSetting({ enable: true, lastDisableTimestamp: undefined });
    }, DISABLE_DURATION_LONG + lastDisableTimestamp - Date.now());
  } else if (enable) {
    enableRecoverTimer && clearTimeout(enableRecoverTimer);
    enableRecoverTimer = undefined;
  }

  browser.runtime.setUninstallURL(language === Lang.JA ? LINKS_JSON.survey_ja : LINKS_JSON.survey_en);
});
/***** SETTING END *****/

/***** POPUP START *****/
function setDefendPopupInfo(uuid: string, windowId?: number): Promise<void> {
  return browser.storage.local.set({
    defendPopupInfo: {
      uuid,
      windowId,
    },
  });
}
async function getDefendPopupInfo(): Promise<
  | {
      uuid: string;
      windowId?: number;
    }
  | undefined
> {
  return (await browser.storage.local.get('defendPopupInfo')).defendPopupInfo;
}

async function closeWindow(id?: number) {
  try {
    typeof id === 'number' && (await browser.windows.remove(id));
  } catch (err) {
    // ...
  }
}

async function createDefendPopup(uuid: string) {
  // is opening
  const currWindowId = (await getDefendPopupInfo())?.windowId;
  if (currWindowId === -1) {
    return;
  }

  // close prev defend
  await closeWindow(currWindowId);

  await setDefendPopupInfo(uuid, -1);

  browser.windows
    .create({
      focused: true,
      url: 'index.html',
      type: 'popup',
      width: 450,
      height: 700,
    })
    .then((newWindow) => setDefendPopupInfo(uuid, newWindow.id))
    .catch((_err) => setDefendPopupInfo(uuid, undefined));
}

listenDefendChange(async (prevDefend, currDefend) => {
  if (currDefend && currDefend?.userStatus === undefined) {
    prevDefend?.uuid !== currDefend?.uuid && createDefendPopup(currDefend.uuid);
  } else {
    closeWindow((await getDefendPopupInfo())?.windowId);
  }
});

browser.runtime.onMessage.addListener(({ event, data }, sender: browser.Runtime.MessageSender) => {
  const { tab } = sender;

  if (event === 'SHOW_DEFEND' && tab) {
    const { uuid } = data;
    const { favIconUrl = '' } = tab;
    favIconUrl && setDefendFavIconUrl(uuid, favIconUrl);
  }
});

browser.windows.onRemoved.addListener(async (windowId: number) => {
  const popupInfo = await getDefendPopupInfo();
  if (!popupInfo) {
    return;
  }

  const { uuid, windowId: currWindowId } = popupInfo;
  if (currWindowId !== windowId || !uuid) {
    return;
  }

  setDefendPopupInfo(uuid, undefined);
  setDefendUserStatus(uuid, false);
});
/***** POPUP END *****/
