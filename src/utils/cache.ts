import browser from '../polyfill/browser';

export async function setCache(cacheName: string, cacheKey: string, value: any, valid?: number) {
  const prev = (await browser.storage.local.get(cacheName))[cacheName];
  browser.storage.local.set({
    [cacheName]: {
      ...prev,
      [cacheKey]: {
        value,
        expired: typeof valid === 'number' ? Date.now() + valid : undefined,
      },
    },
  });
}

export async function getCache(cacheName: string, cacheKey: string) {
  const cache = (await browser.storage.local.get(cacheName))[cacheName];

  setTimeout(() => {
    cache && Object.keys(cache).forEach(key => {
      const { expired } = cache[key];
      if (expired <= Date.now()) {
        delete cache[key];
      }
    });
    browser.storage.local.set({
      [cacheName]: cache,
    });
  }, 1000);

  return cache?.[cacheKey] ? cache[cacheKey].value : undefined;
}