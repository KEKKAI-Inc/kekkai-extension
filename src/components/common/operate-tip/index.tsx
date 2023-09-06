import React, { useEffect } from 'react';

import { TIP_BG_COLOR_MAP, TIP_BORDER_COLOR_MAP, TIP_IMAGE_MAP } from '@/constants/incorrect';
import { TipInfo } from '@/types/tip';

import styles from './index.style';

export function OperateTip({ tipInfo }: { tipInfo: TipInfo }) {
  useEffect(() => {
    for (const key in TIP_IMAGE_MAP) {
      const img = new Image();
      img.src = TIP_IMAGE_MAP[key];
    }
  }, []);

  return (
    <div
      style={{
        ...styles.tipContainer,
        backgroundColor: TIP_BG_COLOR_MAP[tipInfo.type],
        borderColor: TIP_BORDER_COLOR_MAP[tipInfo.type],
        display: tipInfo.isShow ? 'flex' : 'none',
      }}
    >
      <img style={styles.tipImg} src={TIP_IMAGE_MAP[tipInfo.type]} alt="" />
      <p style={styles.tipDes}>{tipInfo.content}</p>
    </div>
  );
}
