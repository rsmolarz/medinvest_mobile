const appJson = require('./app.json');

function getApiBaseUrl() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN 
    || process.env.REPLIT_DEV_DOMAIN
    || process.env.REPLIT_INTERNAL_APP_DOMAIN;
  
  if (domain) {
    const cleanDomain = domain.replace(/:5000$/, '');
    const protocol = cleanDomain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${cleanDomain}`;
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
