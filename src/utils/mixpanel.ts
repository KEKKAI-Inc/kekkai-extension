import mixpanel from 'mixpanel-browser';

import { IS_DEV } from '@/utils/dev';
import { IS_WEB } from '@/utils/platform';

let hasInit = false;
export function init() {
  mixpanel.init('1fdc14ede649e0330d3bf90740df79f9');
  hasInit = true;
}

const commonParams = {
  platform: IS_WEB ? 'web' : 'extension',
};

export function collect(event: string, _params?: Record<string, string | number | boolean | undefined>) {
  const params = {
    ...commonParams,
    ..._params,
  };

  if (IS_DEV) {
    console.log(`>> KEKKAI collect event [${event}] params: `, params);
    return;
  }

  if (!hasInit) {
    init();
  }

  mixpanel.track(event, params);
}
