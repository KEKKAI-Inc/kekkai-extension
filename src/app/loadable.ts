import Loadable from 'react-loadable';

export const LoadableDefend = Loadable({
  loader: () => import('../pages/defend'),
  loading: () => null,
});

export const LoadableSetting = Loadable({
  loader: async () => (await import('../pages/setting')).Setting,
  loading: () => null,
});

export const LoadableWhitelist = Loadable({
  loader: async () => (await import('../pages/allowlist-setting')).AllowlistSetting,
  loading: () => null,
});

export const LoadableReporting = Loadable({
  loader: async () => (await import('../pages/reporting')).Reporting,
  loading: () => null,
});
 