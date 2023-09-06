import { Risk } from '@/types/risk';

export const RISK_COLOR = {
  [Risk.NONE]: '#333333',
  [Risk.SAFE]: '#61C554',
  [Risk.ALARM]: '#F4BF4F',
  [Risk.WARNING]: '#F74B5E',
};

export const RISK_COLOR_HOVER = {
  [Risk.NONE]: '#333333',
  [Risk.SAFE]: '#379B2A',
  [Risk.ALARM]: '#C99426',
  [Risk.WARNING]: '#CA2336',
};
