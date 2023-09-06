import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { DefendParams } from '../types/defend';
import { ROUTERS } from '../constants/routers';

import { getDefend, listenDefendChange } from '../utils/defend';

import { Header } from '../components/header';
import { LinkGroup } from '../components/link-group';

import './style.scss';
import { IS_WEB } from '../utils/platform';
 
export const Layout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== `/`) {
      return;
    }

    const defendHandler = (defend?: DefendParams) => {
      defend && defend.userStatus === undefined && navigate(ROUTERS.TRANSACTION_PREVIEW);
    };

    getDefend().then((defend) => defendHandler(defend));
    const removeListener = listenDefendChange(async (_, defend) => defendHandler(defend));
    return removeListener;
  }, [pathname, navigate]);

  return (
    <div className={`kekkai-container ${IS_WEB ? 'web' : 'extension'}`}>
      <Header />
      <Outlet />
      <LinkGroup />
    </div>
  );
};
