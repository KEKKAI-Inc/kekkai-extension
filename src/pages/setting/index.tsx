import { useNavigate } from 'react-router-dom';
import React, { useState, useRef, useCallback, useEffect } from 'react';

import { ENV } from '../../types/setting';
import browser from '../../polyfill/browser';

import { ROUTERS } from '../../constants/routers';
import { IMAGE_PATH } from '../../constants/image-path';

import { useSetting } from '../../hooks/use-setting';
import { useTranslate } from '../../hooks/use-translate';

import { setSetting } from '../../utils/setting';
import { getFeatureGating, setFeatureGating } from '../../utils/feature-gating';

import { Feedback } from '../../components/feedback';
import { LangSetting } from '../../components/lang-setting';
import { NftValuationSwitcher } from '../../components/nft-valuation-switcher';

import './style.scss';


export function Setting() {
  const { t } = useTranslate();
  const { setting } = useSetting();
  const navigate = useNavigate();

  const [ allowlistTipShow, setAllowlistTipShow ] = useState<boolean>(false);
  const versionRef = useRef<string>(browser.runtime.getManifest().version);
  const clickCountRef = useRef<number>(0);

  // enter prerelease
  const handleStarClick = useCallback(async () => {
    clickCountRef.current++;
    if (clickCountRef.current >= 10 && setting.env !== ENV.PRERELEASE) {
      setSetting({ env: ENV.PRERELEASE });
    }
  }, [setting.env]);

  useEffect(() => {
    (async () => {
      const { allowlist } = (await getFeatureGating());
      if (!allowlist) {
        setAllowlistTipShow(true);
      }
    })();
  }, []);

  return ( 
    <>
      <div style={{ height: '160px', display: 'flex', alignItems: 'center' }}>
        <img
          src={IMAGE_PATH.STAR}
          style={{ width: '160px', filter: 'drop-shadow(0px 4px 15px rgba(0, 0, 0, 0.23))' }}
          alt=""
          onClick={handleStarClick}
        />
      </div>

      {setting.env === ENV.PRERELEASE &&
        <div
          className='kekkai-setting-button'
          onClick={() => {
            setSetting({ env: ENV.ONLINE });
            clickCountRef.current = 0;
          }}
        >
          Exit Pre Env
        </div>
      }

      <div style={{ fontSize: '18px', color: '#2D2D2D', width: '80%', fontWeight: '700', lineHeight: '22px' }}>
        {t('setting.setting')}
      </div>

      <LangSetting/>

      <div style={{ fontSize: '14px', color: '#333333', width: '80%', margin: '15px 0 5px', lineHeight: '17px' }}>
        {t('setting.allowlist')}
      </div>

      <div style={{ fontSize: '14px', color: '#C6C6C6', width: '80%', lineHeight: '17px' }}>
        {setting.allowlist.length || 0} {t('setting.allowlist_setted')}
      </div>

      <div
        className='kekkai-setting-button kekkai-setting-allowlist-btn'
        onClick={() => {
          navigate(`../${ROUTERS.WHITELIST}?from=${ROUTERS.SETTING}`);
          setFeatureGating({ allowlist: true });
          setAllowlistTipShow(false);
        }}
      >
        {t('setting.allowlist_set_btn')}
        <div className='kekkai-setting-allowlist-btn-new' style={{ display:allowlistTipShow ? 'block' : 'none' }}/>
      </div>

      <NftValuationSwitcher />

      <Feedback prefixText={t('feedback.got_problem')} />

      <div style={{ color: '#D8D8D8', fontSize: '14px', marginTop: '10px' }}>
        {t('setting.version_label')} Alpha {versionRef.current}
      </div>
    </>
  )
}