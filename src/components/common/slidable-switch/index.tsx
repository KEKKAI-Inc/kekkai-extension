import React from 'react';

import './style.scss';

export function SlidableSwitch ({
  isTurnOn,
  onClick,
}: {
  isTurnOn?: boolean;
  onClick?: () => void;
}) {

  return (
    <div 
      onClick={() => {
        onClick && onClick();
      }}
      className='kekkai-slidable-switch-box'
      style={{
        backgroundColor: isTurnOn ? '#333333' : '#DDDDDD',
      }}
    >
      <div
        className='kekkai-slidable-switch-ball'
        style={{
          left: isTurnOn ? 'calc(100% - 18px)' : '4px',
        }}
      />
    </div>
  )
}