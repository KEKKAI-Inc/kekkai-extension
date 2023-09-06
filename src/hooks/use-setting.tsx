import { useEffect, useState } from 'react';
import { Setting } from '../types/setting';
import { DEFAULT_SETTING } from '../constants/setting';
import { getSetting, listenSettingChange } from '../utils/setting';

export function useSetting() {
  const [ setting, setSetting ] = useState<Setting>(DEFAULT_SETTING);

  useEffect(() => {
    getSetting().then((setting: Setting) => setSetting(setting));
    return listenSettingChange((setting: Setting) => setSetting(setting));
  }, []);

  return { setting };
}