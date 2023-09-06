import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { IMAGE_PATH } from '@/constants/image-path';
import { ROUTERS } from '@/constants/routers';
import { useLink } from '@/hooks/use-link';
import { useTranslate } from '@/hooks/use-translate';
import { Link } from '@/types/link';
import { openLink } from '@/utils/open-link';

import './style.scss';

export function LinkGroup() {
  const { links } = useLink();
  const { t } = useTranslate();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!links.twitter && !links.discord && !links.website) {
    return null;
  }

  return (
    <div className="kekkai-link-group-wrap">
      <div className="kekkai-link-group">
        {links.twitter && (
          <img
            src={IMAGE_PATH.TWITTER}
            alt="twitter"
            onClick={() => {
              openLink(Link.TWITTER, links.twitter);
            }}
          />
        )}
        {links.discord && (
          <img
            src={IMAGE_PATH.DISCORD}
            style={{ marginLeft: '15px' }}
            alt="discord"
            onClick={() => {
              openLink(Link.DISCORD, links.discord);
            }}
          />
        )}
        {links.website && (
          <img
            src={IMAGE_PATH.WEBSITE}
            style={{ marginLeft: '15px' }}
            alt="website"
            onClick={() => {
              openLink(Link.WEBSITE, links.website);
            }}
          />
        )}
      </div>

      {[ROUTERS.TRANSACTION_PREVIEW].includes(pathname.slice(1)) && (
        <div
          className="report-btn"
          onClick={() => {
            const from = pathname.slice(1);
            navigate(ROUTERS.REPORTING + (from ? `?from=${from}` : ''));
          }}
        >
          {t('report.common_foot_btn')}
        </div>
      )}
    </div>
  );
}
