import React from 'react';
import ReactDOM from 'react-dom';

import { IncorrectFeedback } from '@/components/incorrect-feedback';
import { addDocumentMessageListener } from '@/utils/message';

import { setting } from './setting';

addDocumentMessageListener('INCORRECT_FEEDBACK_SHOW', (args: any) => {
  if (!!document.querySelector('.kekkai-incorrect-feedback-container')) {
    return;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  ReactDOM.render(<IncorrectFeedback {...{ ...args, setting, onClose: () => container.remove() }} />, container);
});
