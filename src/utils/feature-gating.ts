import browser from '@/polyfill/browser';
import { FeatureGating } from '@/types/feature-gating';

const DEFAULT_FEATURE_GATING = { allowlist: false, setting: false };

export const getFeatureGating = async (): Promise<FeatureGating> => {
  const { featureGating } = await browser.storage.local.get('featureGating');
  return { ...DEFAULT_FEATURE_GATING, ...featureGating };
};

export const setFeatureGating = async (args: Partial<FeatureGating>) => {
  const featureGating = await getFeatureGating();
  return browser.storage.local.set({
    featureGating: {
      ...featureGating,
      ...args,
    },
  });
};
