import { debounce } from 'lodash-es';
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';

import { IMAGE_PATH } from '../../constants/image-path';
import { useTranslate } from '../../hooks/use-translate';
import { Setting } from '../../types/setting';
import { getSetting, setSetting } from '../../utils/setting';
import { Feedback } from '../feedback';

const DISABLE_DURATION_LONG = 30 * 60 * 1000; // 30 min

export function Home() {
  const { t } = useTranslate();

  const timerRef = useRef<NodeJS.Timer>();
  const [ enable, setEnable ] = useState<boolean>(true);
  const [ lastDisableTimestamp, setLastDisableTimestamp ] = useState<number>();
  const [ remainDisableSeconds, setRemainDisableSeconds ] = useState<number>();

  useEffect(() => {
    getSetting().then(({ enable, lastDisableTimestamp }: Setting) => {
      setEnable(enable);
      setLastDisableTimestamp(lastDisableTimestamp);
    });
  }, []);

  useEffect(() => {
    if (!lastDisableTimestamp) {
      return;
    }

    setRemainDisableSeconds(Math.ceil((DISABLE_DURATION_LONG - (Date.now() - lastDisableTimestamp)) / 1000));

    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemainDisableSeconds(Math.ceil((DISABLE_DURATION_LONG - (Date.now() - lastDisableTimestamp)) / 1000));
      if (DISABLE_DURATION_LONG <= (Date.now() - lastDisableTimestamp)) {
        setEnable(true);
        setSetting({ enable: true });
      }
    }, 1 * 1000);

    return () => {
      timerRef.current && clearInterval(timerRef.current);
      timerRef.current = undefined;
    };
  }, [lastDisableTimestamp]);

  const handleEnableToggle = useCallback(debounce(() => {
    const nextEnable = !enable;

    if (!nextEnable) {
      const now = Date.now();
      setLastDisableTimestamp(now);
      setEnable(false);
      setSetting({
        enable: false,
        lastDisableTimestamp: now,
      });
    } else {
      setEnable(true);
      setSetting({ enable: true });
    }
  }, 100), [enable]);

  const textTip = useMemo(() => {
    if (enable) {
      return (<div>{t('home.running_tip')}</div>);
    }

    if (!remainDisableSeconds || remainDisableSeconds > 60) {
      return (
        <div>{t('home.be_working_tip_before')}<span style={{ color: '#B02132' }}>{Math.ceil((remainDisableSeconds || (DISABLE_DURATION_LONG / 1000)) / 60)}</span> {t('common.minutes')}{t('home.be_working_tip_after')}</div>
      );
    }

    return (
      <div>{t('home.be_working_tip_before')}<span style={{ color: '#B02132' }}>{Math.ceil(remainDisableSeconds)}</span> {t('common.seconds')}{t('home.be_working_tip_after')}</div>
    );
  }, [t, enable, remainDisableSeconds]);

  return (
    <>
      <div style={{ height: '160px', display: 'flex', alignItems: 'center' }}>
        <img src={IMAGE_PATH.MAIN} style={{ width: '160px', filter: 'drop-shadow(0px 4px 15px rgba(0, 0, 0, 0.23))', opacity: enable ? 1 : 0.3 }} alt="main" />
      </div>

      <div
        style={{
          cursor: 'pointer', 
          padding: '6px 8px',
          background: 'linear-gradient(92.05deg, #161616 0%, #4E4E4E 48.96%, #222222 100%)',
          borderRadius: '10px',
          display: 'flex',
          color: '#ffffff',
          alignItems: 'center',
          marginTop: '10px',
        }}
        onClick={handleEnableToggle}
      >
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={enable ? IMAGE_PATH.PAUSE : IMAGE_PATH.PLAY} style={{ height: '20px' }} alt={enable ? "pause" : "play"} />
        </div>
        <div style={{ marginLeft: '6px', fontSize: '12px' }}>
          {enable ? t('home.btn_pause') : t('home.btn_recover')}
        </div>
      </div>

      <div style={{ fontSize: '14px', marginTop: '10px', textAlign: 'center', whiteSpace: 'break-spaces' }}>
        {textTip}
      </div>

      <Feedback prefixText={t('feedback.got_problem')} />
    </>
  );
}