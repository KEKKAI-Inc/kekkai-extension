import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import I18N from '../constants/json/i18n.json';
import { DEFAULT_SETTING } from '../constants/setting';
import { Lang } from '../types/setting';
import { IS_DEV } from '../utils/dev';

const REMOTE_I18N_URL =
  'https://firebasestorage.googleapis.com/v0/b/kekkai/o/kekkai%2Fkekkai-json%2Fi18n.json?alt=media&token=e22731c2-8138-4836-8b1f-faa3419c5889';

export function useTranslate(lang: Lang) {
  const [language] = useState<Lang>(lang || DEFAULT_SETTING.language);
  const [i18n, setI18N] = useState<Record<string, Record<Lang, string>>>(I18N);

  useEffect(() => {
    if (IS_DEV) {
      return;
    }

    (async () => {
      try {
        const res = await axios.get(REMOTE_I18N_URL);
        if (Object.keys(res.data).length) {
          setI18N((prev) => {
            const next = { ...prev, ...res.data };
            return next;
          });
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const t = useCallback(
    (key: string, ...slotValue: (string | number)[]): string => {
      const text = i18n[key]?.[language] || i18n[key][DEFAULT_SETTING.language];

      if (typeof text === 'undefined') {
        return key;
      }

      return text.replace(/{{\$(\d+)}}/g, (_, match: string) => {
        const index = Number(match) - 1;
        return String(slotValue?.[index]) || '';
      });
    },
    [i18n, language],
  );

  return { t, language };
}
