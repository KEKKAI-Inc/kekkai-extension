import browser from 'webextension-polyfill';
import { setDefendFavIconUrl, setDefendUserStatus } from '../../utils/defend';

if (browser.scripting) {
  browser.scripting
    .unregisterContentScripts()
    .then(() => {
      const scripts = [
        {
          id: 'Kekkai Script',
          matches: ['file://*/*', 'http://*/*', 'https://*/*'],
          js: ['injectedScript.bundle.js'],
          allFrames: true,
          runAt: 'document_start',
          world: 'MAIN',
        },
      ];
      (browser.scripting as any).registerContentScripts(scripts, () => {});
    })
    .catch((err: any) => {});
}

function setCurrUuid(id: string | undefined): Promise<void> {
  return browser.storage.local.set({ uuid: id });
}

async function getCurrUuid(): Promise<string | undefined> {
  return (await browser.storage.local.get('uuid')).uuid; 
}

function setCurrWindowId(id: number | undefined): Promise<void> {
  return browser.storage.local.set({ windowId: id });
}

async function getCurrWindowId(): Promise<number | undefined> {
  return (await browser.storage.local.get('windowId')).windowId; 
}

async function handleShowDefend() {
  // is opening
  const currentWindowId = await getCurrWindowId();
  if (currentWindowId === -1) {
    return;
  }

  // close prev defend
  currentWindowId && browser.windows.remove(currentWindowId);

  setCurrWindowId(-1);

  browser.windows
    .create({
      focused: true,
      url: 'popup.html',
      type: 'popup',
      width: 460,
      height: 610,
    })
    .then((createdWindow) => {
      setCurrWindowId(createdWindow?.id);
    })
    .catch(err => {
      setCurrWindowId(undefined);
    });
}

browser.storage.onChanged.addListener(async (changes: Record<string, any>, area: string) => {
  if (area !== 'local' || !changes.defend?.newValue) {
    return
  }


  if (changes.defend?.oldValue?.uuid !== changes.defend?.newValue.uuid
    && changes.defend?.newValue.userStatus === undefined
  ) {
    handleShowDefend();
  }

  const currentWindowId = await getCurrWindowId();
  if (changes.defend?.newValue.userStatus !== undefined) {
    currentWindowId && browser.windows.remove(currentWindowId);
  }
});

browser.runtime.onMessage.addListener((request, sender) => {
  const { event, data } = request;
  const { tab } = sender as browser.Runtime.MessageSender & { origin: string };

  // get defend uuid and favIconUrl
  if (event === 'SHOW_DEFEND' && tab) {
    const { favIconUrl = '' } = tab;
    setCurrUuid(data.uuid);
    favIconUrl && setDefendFavIconUrl(data.uuid, favIconUrl);
  }
});

browser.windows.onRemoved.addListener(async (windowId: number) => {
  if (await getCurrWindowId() !== windowId) {
    return;
  }
  setCurrWindowId(undefined);
  getCurrUuid().then(uuid => {
    uuid && setDefendUserStatus(uuid, false);
  });
});
