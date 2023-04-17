import React from 'react';
import { render } from 'react-dom';
import mixpanel from 'mixpanel-browser';

import Popup from './Popup';
import '../../assets/styles/tailwind.css';

mixpanel.init('1fdc14ede649e0330d3bf90740df79f9');

render(<Popup />, window.document.querySelector('#app-container'));

if ((module as any).hot) (module as any).hot.accept();
