import { TipType } from '../types/tip';
import { IMAGE_PATH } from './image-path';

export const TIP_BG_COLOR_MAP = {
  [TipType.SUCCESS]: '#EAF6EE',
  [TipType.ERROR]: '#FCEDEA',
  [TipType.LOADING]: '#E6EFF9',
};

export const TIP_BORDER_COLOR_MAP = {
  [TipType.SUCCESS]: '#48BD6A',
  [TipType.ERROR]: '#E85336',
  [TipType.LOADING]: '#0C6CDC',
};

export const TIP_IMAGE_MAP: Record<string, string> = {
  [TipType.SUCCESS]: IMAGE_PATH.REPORT_TIP_SUCCESS,
  [TipType.ERROR]: IMAGE_PATH.REPORT_TIP_ERROR,
  [TipType.LOADING]: IMAGE_PATH.REPORT_TIP_LOADING,
};
