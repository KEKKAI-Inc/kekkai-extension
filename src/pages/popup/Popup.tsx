import browser from 'webextension-polyfill';
import React, { useEffect, useMemo, useState } from 'react';
import Loadable from 'react-loadable';

import { Header } from '../../components/header';
import { LinkGroup } from '../../components/link-group';
import { Home } from '../../components/home';

import { Setting } from '../../components/setting';
import { getDefend } from '../../utils/defend';
import { DefendParams } from '../../types/defend';

import './style.scss';

const LoadableDefend = Loadable({
  loader: () => import('../../components/defend'),
  loading: () => null,
});
 

const Popup = () => {
  const [ isSetting, setIsSetting ] = useState<boolean>(false);
  const [ defend, setDefend ] = useState<DefendParams>();

  useEffect(() => {
    document.title = 'KEKKAI 結界';
  }, []);

  useEffect(() => {
    getDefend().then((defend) => setDefend(defend));

    const handler = (changes: Record<string, any>, area: string) => {
      if (area !== 'local') {
        return;
      }
      if (changes.defend?.newValue) {
        setDefend(changes.defend?.newValue);
      } else if (changes.defend?.oldValue) {
        setDefend(undefined);
      }
    };
    
    browser.storage.onChanged.addListener(handler);
    return () => browser.storage.onChanged.removeListener(handler);
  }, []);

  const popupBody = useMemo(() => {
    if (isSetting) {
      return <Setting />;
    }

    if (defend && defend.userStatus === undefined) {
      return <LoadableDefend {...defend} />;
    }

    return <Home />;
  }, [defend, isSetting]);

  return (
    <div className='kekkai-container'>
      <Header isSetting={isSetting} setIsSetting={setIsSetting} />
      {popupBody}
      <LinkGroup />
    </div>
  );
};

export default Popup;
