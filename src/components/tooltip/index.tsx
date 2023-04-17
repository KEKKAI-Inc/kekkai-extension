import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

export function Tooltip({
  content,
  children,
  visible,
  gapOffset = 6,
  placement = 'bottom',
}: {
  content: string;
  children: JSX.Element;
  visible?: boolean;
  gapOffset?: number;
  placement?: 'bottom' | 'left' | 'top';
}) {
  return (
    <Tippy visible={visible} content={content} placement={placement} arrow offset={[0, gapOffset]} delay={100} hideOnClick={false}>
      {children}
    </Tippy>
  );
}