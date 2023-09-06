import { Setting } from '@/types/setting';

import { Simulation } from './simulation';

export interface IncorrectFeedbackParams {
  setting: Setting;
  onClose: () => void;
  type: 'transaction' | 'approve' | 'transfer' | 'sign' | 'scam_warning_web';
  url: string;
  contract?: string;
  user?: string;
  simulation?: Simulation;
}
