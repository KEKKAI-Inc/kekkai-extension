import './polyfill/fake-storage';

import React from 'react';
import { render } from 'react-dom';

import { init } from './utils/mixpanel';
import { App } from './app';

import './global.scss';

init();

render(
  <App />,
  window.document.querySelector('#root'),
);

(module as any).hot?.accept();