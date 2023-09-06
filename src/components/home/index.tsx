import { debounce } from 'lodash-es';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IMAGE_PATH } from '@/constants/image-path';
import { ROUTERS } from '@/constants/routers';
import { DISABLE_DURATION_LONG } from '@/constants/setting';
import { useSetting } from '@/hooks/use-setting';
import { useTranslate } from '@/hooks/use-translate';
import { collect } from '@/utils/mixpanel';
import { setSetting } from '@/utils/setting';

import EnableToggleButton from './enable-toggle-button/EnableToggleButton';
import { Feedback } from '../feedback';

import './style.scss';

export function Home() {
  const { t } = useTranslate();
  const {
    setting: { enable, lastDisableTimestamp },
  } = useSetting();
  const navigate = useNavigate();

  const timerRef = useRef<NodeJS.Timer>();
  const [remainDisableSeconds, setRemainDisableSeconds] = useState<number>(0);

  useEffect(() => {
    if (enable || !lastDisableTimestamp) {
      return;
    }

    setRemainDisableSeconds(Math.ceil((DISABLE_DURATION_LONG - (Date.now() - lastDisableTimestamp)) / 1000));

    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemainDisableSeconds(Math.ceil((DISABLE_DURATION_LONG - (Date.now() - lastDisableTimestamp)) / 1000));
      if (DISABLE_DURATION_LONG <= Date.now() - lastDisableTimestamp) {
        setSetting({ enable: true, lastDisableTimestamp: undefined });
      }
    }, 1 * 1000);

    return () => {
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = undefined;
    };
  }, [enable, lastDisableTimestamp]);

  const handleEnableToggle = useCallback(
    debounce(() => {
      const now = Date.now();
      const nextEnable = !enable;
      setSetting({
        enable: nextEnable,
        lastDisableTimestamp: !nextEnable ? now : undefined,
      });
      collect('enable_setting', {
        value: nextEnable,
      });
    }, 100),
    [enable],
  );

  return (
    <>
      <div style={{ height: '160px', display: 'flex', alignItems: 'center' }}>
        <img
          src={IMAGE_PATH.MAIN}
          style={{
            width: '160px',
            filter: 'drop-shadow(0px 4px 15px rgba(0, 0, 0, 0.23))',
            opacity: enable || remainDisableSeconds <= 0 ? 1 : 0.3,
          }}
          alt="main"
        />
      </div>
      <EnableToggleButton
        handleEnableToggle={handleEnableToggle}
        enable={enable || remainDisableSeconds <= 0}
        remainDisableSeconds={remainDisableSeconds}
      />
      <div style={{ marginTop: '34px', whiteSpace: 'break-spaces' }}>
        <div style={{ fontSize: '16px', fontWeight: 700 }}>{t('report.title')}</div>
        <div style={{ fontSize: '12px', lineHeight: '15px', marginTop: '7px' }}>{t('report.title_des')}</div>
      </div>

      <div onClick={() => navigate(ROUTERS.REPORTING)} className="kekkai-home-report-btn">
        {t('report.title')}
      </div>
      <Feedback prefixText={t('feedback.got_problem')} />
    </>
  );
}
