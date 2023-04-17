import browser from 'webextension-polyfill';
import { Setting } from '../types/setting';
import { DEFAULT_SETTING } from '../constants/setting';

export const setSetting = async (args: Partial<Setting>) => {
  const setting = await getSetting();
  return browser.storage.sync.set({ setting: {
    ...setting,
    ...args,
  }});
};

export const getSetting = async (): Promise<Setting> => {
  const { setting } = await browser.storage.sync.get('setting');
  return { ...DEFAULT_SETTING, ...setting };
};

export const listenSettingChange = (cb: (setting: Setting) => void): () => void => {
  const handler = (changes: Record<string, any>, area: string) => {
    if (area === 'sync' && changes.setting?.newValue) {
      cb(changes.setting?.newValue);
    }
  };
  browser.storage.onChanged.addListener(handler);

  return () => browser.storage.onChanged.removeListener(handler);
}