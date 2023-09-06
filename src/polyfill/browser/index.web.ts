import { noop, pull } from 'lodash-es';

import manifestJson from '@/manifest.json';
import { emitter } from '@/utils/emitter';
import { parseQuery } from '@/utils/url';

const runtime = {
  getManifest: () => {
    return manifestJson;
  },
  onInstalled: {
    addListener: noop,
    removeListener: noop,
  },
  setUninstallURL: noop,
  sendMessage: ({ event, data }: { event: string; data: any }) => {
    emitter.emit(event, data);
  },
  onMessage: {
    addListener: (event: string, cb: (params: any) => void) => {
      emitter.on(event, cb);
    },
    removeListener: (event: string, cb: (params: any) => void) => {
      emitter.off(event, cb);
    },
  },
  getURL: () => {
    return '';
  },
};

type Changes = Record<
  string,
  {
    newValue: any;
    oldValue: any;
  }
>;

type StorageListener = (changes: Changes, area: 'local' | 'sync') => void;

function getMockStorage(area: 'local' | 'sync', listeners: StorageListener[]) {
  const mockStorage = {
    set: (object: Record<string, any>) => {
      const data = JSON.parse(window.localStorage.getItem(area) || '{}');
      const changes: Changes = Object.create(null);
      Object.keys(object).forEach((key) => {
        changes[key] = {
          oldValue: data[key],
          newValue: object[key],
        };
        data[key] = object[key];
      });
      window.localStorage.setItem(area, JSON.stringify(data));
      listeners.forEach((listener) => {
        try {
          listener(changes, area);
        } catch (err) {
          // ...
        }
      });
    },
    get: (key: string) => {
      const data = JSON.parse(window.localStorage.getItem(area) || '{}');
      return { [key]: data[key] };
    },
    remove: (key: string) => {
      const prev = JSON.parse(window.localStorage.getItem(area) || '{}');
      delete prev[key];
      window.localStorage.setItem(area, JSON.stringify(prev));
    },
    clear: () => {
      window.localStorage.removeItem(area);
    },
  };

  return mockStorage;
}

class Storage {
  private listener: StorageListener[] = [];
  public local = getMockStorage('local', this.listener);
  public sync = getMockStorage('sync', this.listener);
  public onChanged = {
    addListener: (cb: StorageListener) => {
      this.listener.push(cb);
    },
    removeListener: (cb: StorageListener) => {
      pull(this.listener, cb);
    },
  };
}

const windows = {
  create: () => {
    // ...
  },
  remove: () => {
    // ...
  },
  onRemoved: {
    addListener: noop,
    removeListener: noop,
  },
};

const { detect_website } = parseQuery(window.location.href);

const Runtime = {
  MessageSender: {
    tab: {
      favIconUrl: detect_website ? detect_website + (detect_website.slice(-1) === '/' ? '' : '/') + 'favicon.ico' : '',
    },
  },
};

const tabs = {
  create: ({ url }: { url: string }) => url && window.opne(url),
};

const i18n = {
  getUILanguage: () => window.navigator.language,
};

const browser = {
  runtime,
  storage: new Storage(),
  windows,
  scripting: null,
  Runtime,
  tabs,
  i18n,
};

export default browser;
