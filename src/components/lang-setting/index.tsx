import React, { useCallback, useState } from 'react';

import { IMAGE_PATH } from '@/constants/image-path';
import { LANG_NAME } from '@/constants/language';
import { useSetting } from '@/hooks/use-setting';
import { useTranslate } from '@/hooks/use-translate';
import { Lang } from '@/types/setting';
import { collect } from '@/utils/mixpanel';
import { setSetting } from '@/utils/setting';

import './style.scss';

export function LangSetting() {
  const { setting } = useSetting();
  const { t } = useTranslate();

  const [langDropdownShow, setLangDropdownShow] = useState<boolean>(false);

  const handleLangChange = useCallback((lang: Lang) => {
    setSetting({ language: lang });
    collect('language_setting', {
      value: lang,
    });
  }, []);

  return (
    <>
      <div style={{ fontSize: '14px', color: '#333333', width: '80%', margin: '13px 0 10px', lineHeight: '17px' }}>
        {t('setting.language')}
      </div>
      <div className="kekkai-setting-dropdown" onClick={() => setLangDropdownShow((prev) => !prev)}>
        <div>{LANG_NAME[setting.language]}</div>
        <img src={IMAGE_PATH.DROPDOWN} alt="dropdown" />

        {langDropdownShow && (
          <div className="kekkai-setting-dropdown-content">
            {Object.values(Lang).map((lang) => {
              if (lang === setting.language) {
                return null;
              }
              return (
                <div key={lang} className="kekkai-setting-dropdown-content-item" onClick={() => handleLangChange(lang)}>
                  {LANG_NAME[lang]}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
