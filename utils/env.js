const targetBrowser = process.env.TARGET_BROWSER;
const isWeb = targetBrowser === 'web';

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || isWeb ? 3001 : 3000,
};
