import Tippy from '@tippyjs/react';
import React, { ReactNode } from 'react';

import 'tippy.js/dist/tippy.css';
import './style.scss';

export function Tooltip({
  content,
  children,
  visible,
  gapOffset = 6,
  placement = 'bottom',
  light = false,
}: {
  content: string | ReactNode;
  children: JSX.Element;
  visible?: boolean;
  gapOffset?: number;
  placement?: 'bottom' | 'left' | 'top';
  light?: boolean;
}) {
  return (
    <Tippy
      className={light ? 'tippy-content-light' : ''}
      visible={visible}
      content={content}
      placement={placement}
      arrow
      offset={[0, gapOffset]}
      delay={100}
      hideOnClick={false}
    >
      {children}
    </Tippy>
  );
}
