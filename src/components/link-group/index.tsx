import React from 'react';
import { IMAGE_PATH } from '../../constants/image-path';
import { useLink } from '../../hooks/use-link';

import './style.scss';

export function LinkGroup() {
  const { links } = useLink();

  if (!links.twitter && !links.discord && !links.website) {
    return null;
  }

  return (
    <>
      <div className='kekkai-link-group'>
        {links.twitter && <img src={IMAGE_PATH.TWITTER} alt="twitter" onClick={() => window.open(links.twitter)} />}
        {links.discord && <img src={IMAGE_PATH.DISCORD} style={{ marginLeft: '15px' }} alt="discord" onClick={() => window.open(links.discord)} />}
        {links.website && <img src={IMAGE_PATH.WEBSITE} style={{ marginLeft: '15px' }} alt="website" onClick={() => window.open(links.website)} />}
      </div>
    </>
  );
}
