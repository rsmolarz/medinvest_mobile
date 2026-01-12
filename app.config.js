const appJson = require('./app.json');

function getApiBaseUrl() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN 
    || (process.env.REPLIT_DEV_DOMAIN ? `${process.env.REPLIT_DEV_DOMAIN}:5000` : null)
    || (process.env.REPLIT_INTERNAL_APP_DOMAIN ? `${process.env.REPLIT_INTERNAL_APP_DOMAIN}` : null);
  
  if (domain) {
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}`;
  }
  
  return 'http://localhost:5000';
}

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo?.extra,
      apiBaseUrl: getApiBaseUrl(),
    },
  },
};
