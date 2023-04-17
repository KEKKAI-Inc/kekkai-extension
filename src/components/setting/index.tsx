import React, { useState } from 'react';
import { IMAGE_PATH } from '../../constants/image-path';
import { LANG_NAME } from '../../constants/language';
import { useTranslate } from '../../hooks/use-translate';
import { Lang } from '../../types/setting';
import { setSetting } from '../../utils/setting';
import { Feedback } from '../feedback';
import './style.scss';

export function Setting() {
  const { t, language } = useTranslate();
  const [ langDropdownShow, setLangDropdownShow ] = useState<boolean>(false);

  return (
    <>
      <div style={{ height: '160px', display: 'flex', alignItems: 'center' }}>
        <img src={IMAGE_PATH.STAR} style={{ width: '160px', filter: 'drop-shadow(0px 4px 15px rgba(0, 0, 0, 0.23))' }} alt="" />
      </div>

      <div style={{ fontSize: '14px', color: '#333333', width: '80%' }}>
        {t('setting.language')}
      </div>

      <div className='kekkai-setting-dropdown' onClick={() => setLangDropdownShow((prev) => !prev)}>
        <div>{LANG_NAME[language]}</div>
        <img src={IMAGE_PATH.DROPDOWN} alt='dropdown' />
        {langDropdownShow && (
          <div className='kekkai-setting-dropdown-content'>
            {Object.values(Lang).map((lang) => {
              if (lang === language) {
                return null;
              }

              return (
                <div
                  key={lang}
                  className='kekkai-setting-dropdown-content-item'
                  onClick={() => setSetting({
                    language: lang
                  })}
                >
                  {LANG_NAME[lang]}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Feedback prefixText={t('feedback.got_problem')} />

      <div style={{ color: '#D8D8D8', fontSize: '14px', marginTop: '10px' }}>
        {t('setting.version_label')} Alpha
      </div>
    </>
  );
}