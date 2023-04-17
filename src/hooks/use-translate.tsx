import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import I18N from '../constants/json/i18n.json';
import { DEFAULT_SETTING } from '../constants/setting';
import { Lang, Setting } from '../types/setting';
import { getCache, setCache } from '../utils/cache';
import { getSetting, listenSettingChange } from '../utils/setting';

const REMOTE_I18N_URL = 'https://firebasestorage.googleapis.com/v0/b/unismart-fc274.appspot.com/o/kekkai%2Fi18n.json?alt=media&token=84c89497-6b20-4020-a46e-b7a6ff668bd7';

export function useTranslate() {
  const [ language, setLanguage ] = useState<Lang>(DEFAULT_SETTING.language);
  const [ i18n, setI18N ] = useState<Record<string, Record<Lang, string>>>(I18N);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    (async () => {
      try {
        const cacheKey = 'I18N';
        const cache = await getCache(cacheKey, cacheKey);
        if (cache && Object.keys(cache).length) {
          setI18N(cache);
          return;
        }

        const res = await axios.get(REMOTE_I18N_URL);
        if (Object.keys(res.data).length) {
          setI18N(prev => {
            const next = { ...prev, ...res.data };
            setCache(cacheKey, cacheKey, next, 60 * 60 * 1000);
            return next;
          });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    getSetting().then(({ language }: Setting) => setLanguage(language));
    return listenSettingChange(({ language }) => setLanguage(language));
  }, []);

  const t = useCallback((key: string, ...slotValue: (string | number)[]): string => {
    const text = i18n[key]?.[language];

    if (typeof text === 'undefined') {
      return key;
    }

    return text.replace(/{{\$(\d+)}}/g, (_, match: string) => {
      const index = Number(match) - 1;
      return slotValue?.[index] + '' || '';
    });
  }, [i18n, language]);

  return { t, language };
}