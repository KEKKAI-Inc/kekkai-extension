import browser from '../polyfill/browser';
import { DefendParams } from '../types/defend';
import { Risk } from '../types/risk';
import { Simulation } from '../types/simulation';

export const setDefend = async (args: DefendParams) => {
  return browser.storage.local.set({ defend: args });
};

export const getDefend = async (): Promise<DefendParams | undefined> => {
  return (await browser.storage.local.get('defend')).defend;
};

export const listenDefendChange = (cb: (prevDefend?: DefendParams, currDefend?: DefendParams) => void): () => void => {
  const handler = (changes: Record<string, any>, area: string) => {
    if (area === 'local' && changes.defend?.newValue) {
      cb(changes.defend?.oldValue, changes.defend?.newValue);
    }
  };
  browser.storage.onChanged.addListener(handler);

  return () => browser.storage.onChanged.removeListener(handler);
}

export const clearDefend = async (uuid: string): Promise<void> => {
  const defend = await getDefend();
  if (defend?.uuid !== uuid) {
    return;
  }
  return browser.storage.local.remove('defend');
};

export const setDefendSimulation = async (uuid: string, simulation: Simulation) => {
  const defend = await getDefend();
  if (defend?.uuid !== uuid) {
    return;
  }
  return browser.storage.local.set({ defend: {
    ...defend,
    simulation,
  }});
};

export const setDefendFavIconUrl = async (uuid: string, favIconUrl: string) => {
  const defend = await getDefend();
  if (defend?.uuid !== uuid) {
    return;
  }
  return browser.storage.local.set({ defend: {
    ...defend,
    favIconUrl,
  }});
};

export const setDefendUserStatus = async (uuid: string, userStatus: boolean, risk?: Risk) => {
  const defend = await getDefend();
  if (defend?.uuid !== uuid || defend.userStatus !== undefined) {
    return;
  }
  return browser.storage.local.set({ defend: {
    ...defend,
    userStatus,
    risk,
  }});
};
