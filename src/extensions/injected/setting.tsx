import { DEFAULT_SETTING } from '@/constants/setting';
import { Setting } from '@/types/setting';
import { addDocumentMessageListener, sendDocumentMessage } from '@/utils/message';

export let setting: Setting = DEFAULT_SETTING;

addDocumentMessageListener('SETTING_CHANGE', (_) => (setting = _));
sendDocumentMessage('GET_SETTING');
