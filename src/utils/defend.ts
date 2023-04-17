import browser from 'webextension-polyfill';
import { DefendParams } from '../types/defend';
import { Simulation } from '../types/simulation';

export const setDefend = async (args: DefendParams) => {
  return browser.storage.local.set({ defend: args });
};

export const getDefend = async (): Promise<DefendParams | undefined> => {
  return (await browser.storage.local.get('defend')).defend;
};

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

export const setDefendUserStatus = async (uuid: string, userStatus: boolean) => {
  const defend = await getDefend();
  if (defend?.uuid !== uuid || defend.userStatus !== undefined) {
    return;
  }
  return browser.storage.local.set({ defend: {
    ...defend,
    userStatus,
  }});
};
