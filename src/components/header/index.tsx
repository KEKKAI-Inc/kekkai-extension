import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { IMAGE_PATH } from '../../constants/image-path';
import { useTranslate } from '../../hooks/use-translate';
import { Tooltip } from '../tooltip';

export function Header({
  isSetting,
  setIsSetting,
}: {
  isSetting: boolean;
  setIsSetting: (setting: boolean) => void;
}) {
  const { t } = useTranslate();
  const [ settingTipShow, setSettingTipShow ] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const { launch = 0 } = await browser.storage.local.get('launch');
      if (launch === 1) {
        setSettingTipShow(true);
      }
      browser.storage.local.set({
        launch: launch + 1,
      });
    })();
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '24px',
      width: '100%',
      userSelect: 'none',
    }}>
      <img src={IMAGE_PATH.LOGO} style={{ width: '71px', height: '24px' }} alt='logo' />
      {!isSetting ? (
        <Tooltip content={t('setting.tip')} placement='left' visible={settingTipShow}>
          <img
            src={IMAGE_PATH.STAR}
            style={{ width: '36px', height: '36px', position: 'relative', top: '2px', cursor: 'pointer' }}
            alt='setting'
            onClick={() => setIsSetting(true)}
            onMouseEnter={() => setSettingTipShow(true)}
            onMouseLeave={() => setSettingTipShow(false)}
          />
        </Tooltip>
      ) : (
        <div style={{ padding: '6px 18px', color: '#ffffff', background: '#333333', cursor: 'pointer', borderRadius: '8px' }} onClick={() => setIsSetting(false)}>
          {t('header.back')}
        </div>
      )}
    </div>
  );
}