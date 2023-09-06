import classnames from 'classnames';
import React, { memo, useCallback, useMemo } from 'react';

import { Tooltip } from '@/components/tooltip';
import { IMAGE_PATH } from '@/constants/image-path';
import { DISABLE_DURATION_LONG } from '@/constants/setting';
import { useTranslate } from '@/hooks/use-translate';

import { CIRCLE_PERIMETER } from '../const';

import './styles.scss';

interface ProgressProps {
  handleEnableToggle: () => void;
  enable: boolean;
  remainDisableSeconds: number;
}

const progressBtn: React.FC<ProgressProps> = (props: ProgressProps) => {
  const { enable, handleEnableToggle, remainDisableSeconds } = props;
  const { t } = useTranslate();

  const textTip = useMemo(() => {
    if (enable) {
      return (
        <div>
          <span style={{ fontWeight: 600 }}>{t('home.company')}</span>
          {` ${t('home.running_tip')}`}
        </div>
      );
    }

    if (!remainDisableSeconds || remainDisableSeconds > 60) {
      return (
        <div>
          {t('home.be_working_tip_before')}
          <span style={{ color: '#B02132' }}>
            {Math.ceil((remainDisableSeconds || DISABLE_DURATION_LONG / 1000) / 60)}
          </span>{' '}
          {t('common.minutes')}
          {t('home.be_working_tip_after')}
        </div>
      );
    }

    return (
      <div>
        {t('home.be_working_tip_before')}
        <span style={{ color: '#B02132' }}>{Math.ceil(remainDisableSeconds)}</span> {t('common.seconds')}
        {t('home.be_working_tip_after')}
      </div>
    );
  }, [t, enable, remainDisableSeconds]);

  const cls = classnames({
    'pause-img': enable,
    'play-img': !enable,
  });

  const calPercentage = useCallback(() => {
    if (enable || remainDisableSeconds <= 0) return CIRCLE_PERIMETER;

    const disableSeconds = DISABLE_DURATION_LONG / 1000;
    // 62.8 is started, 0 is ended
    return (
      CIRCLE_PERIMETER -
      (CIRCLE_PERIMETER * (disableSeconds - (remainDisableSeconds || disableSeconds))) / disableSeconds
    ).toFixed(3);
  }, [remainDisableSeconds, enable]);

  return (
    <Tooltip content={textTip} light={true}>
      <div className="button-container" onClick={handleEnableToggle}>
        <div className="toggle-container">
          <svg width="22" height="22">
            {!enable && (
              <circle
                className="circle"
                cx="-11"
                cy="11"
                r="10"
                transform="rotate(-90)"
                style={{
                  strokeDashoffset: calPercentage(),
                }}
              />
            )}
          </svg>
          <img src={enable ? IMAGE_PATH.PAUSE : IMAGE_PATH.PLAY} className={cls} alt={enable ? 'pause' : 'play'} />
          <div className="progress-start-btn" style={{ display: !enable ? 'block' : 'none' }}></div>
        </div>
        <div style={{ marginLeft: '6px', fontSize: '12px' }}>
          {enable ? t('home.btn_pause') : t('home.btn_recover')}
        </div>
      </div>
    </Tooltip>
  );
};

export default memo(progressBtn);
