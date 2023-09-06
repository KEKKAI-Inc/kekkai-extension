import React, { useEffect, useState } from 'react';

import { useSetting } from '@/hooks/use-setting';
import { useTranslate } from '@/hooks/use-translate';
import { getFeatureGating, setFeatureGating } from '@/utils/feature-gating';
import { setSetting } from '@/utils/setting';

import { SlidableSwitch } from '../common/slidable-switch';
import { Tooltip } from '../tooltip';

import './style.scss';

export function NftValuationSwitcher() {
  const { setting } = useSetting();
  const { t } = useTranslate();
  const [showTip, setShowTip] = useState(false);
  useEffect(() => {
    (async () => {
      const { nftValuation } = await getFeatureGating();
      if (!nftValuation) {
        setShowTip(true);
      }
    })();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%',
      }}
    >
      <div className="kekkai-nft-valuation-switch">
        <span>{t('setting.valuation')}</span>
      </div>
      <Tooltip visible={showTip && !setting.nftValuation} light={true} content={t('setting.valuation_tip')}>
        <div onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
          <SlidableSwitch
            isTurnOn={setting.nftValuation}
            onClick={() => {
              setSetting({ nftValuation: !setting.nftValuation });
              setFeatureGating({ nftValuation: true });
            }}
          />
        </div>
      </Tooltip>
    </div>
  );
}
