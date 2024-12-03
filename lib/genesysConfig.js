export const GENESYS_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GC_OAUTH_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || window?.location?.origin,
  appName: 'GCCopilotNext',
  defaultEnvironment: 'mypurecloud.ie',
  defaultLanguage: 'en-us'
};
