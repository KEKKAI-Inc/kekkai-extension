import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { IMAGE_PATH } from '@/constants/image-path';
import { ROUTERS } from '@/constants/routers';
import { useTranslate } from '@/hooks/use-translate';
import { getFeatureGating, setFeatureGating } from '@/utils/feature-gating';
import { parseQuery } from '@/utils/url';

import { Tooltip } from '../tooltip';

export function Header() {
  const { t } = useTranslate();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const [settingTipShow, setSettingTipShow] = useState<boolean>(false);

  const hideHeaderBtn = useMemo(() => parseQuery(search).hideHeaderBtn === 'true', [search]);

  const showBackBtn = useMemo(
    () => [ROUTERS.SETTING, ROUTERS.REPORTING, ROUTERS.WHITELIST].includes(pathname.slice(1)),
    [pathname],
  );

  useEffect(() => {
    (async () => {
      const { setting } = await getFeatureGating();
      if (!setting) {
        setSettingTipShow(true);
      }
    })();
  }, []);

  const backBtnClickHandler = useCallback(() => {
    const _pathname = pathname.slice(1);

    const { from } = parseQuery(search);
    from ? navigate(-1) : navigate(ROUTERS.WHITELIST === _pathname ? ROUTERS.SETTING : '/');
  }, [navigate, pathname, search]);

  const rightBtn = useMemo(() => {
    if (hideHeaderBtn) {
      return null;
    }

    if (showBackBtn) {
      return (
        <div
          style={{
            padding: '6px 18px',
            color: '#ffffff',
            background: '#333333',
            cursor: 'pointer',
            borderRadius: '8px',
          }}
          onClick={backBtnClickHandler}
        >
          {t('header.back')}
        </div>
      );
    }

    return (
      <Tooltip content={t('setting.tip')} placement="left" visible={settingTipShow}>
        <img
          src={IMAGE_PATH.STAR}
          style={{ width: '36px', height: '36px', position: 'relative', top: '2px', cursor: 'pointer' }}
          alt="setting"
          onClick={() => {
            const from = pathname.slice(1);
            navigate(ROUTERS.SETTING + (from ? `?from=${from}` : ''));
            setFeatureGating({ setting: true });
          }}
          onMouseEnter={() => setSettingTipShow(true)}
          onMouseLeave={() => setSettingTipShow(false)}
        />
      </Tooltip>
    );
  }, [backBtnClickHandler, hideHeaderBtn, navigate, pathname, settingTipShow, showBackBtn, t]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '24px',
        width: '100%',
        userSelect: 'none',
      }}
    >
      <img src={IMAGE_PATH.LOGO} style={{ width: '71px', height: '24px' }} alt="logo" />
      {rightBtn}
    </div>
  );
}
