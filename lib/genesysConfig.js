export const GENESYS_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || '//',
  appName: 'GCCopilotNext',
  defaultEnvironment: 'mypurecloud.ie',
  defaultLanguage: 'en-us'
};

export const getRedirectUri = () => {
  if (typeof window === 'undefined') return '//';
  return window.location.origin;
};
