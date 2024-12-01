export function startGCSDKs(clientId) {
  return new Promise((resolve, reject) => {
    const appName = 'Monitor alerts';
    const redirectUri = 'https://gc-call-monitor-agent-alert.vercel.app';
    const gcHostURL = assignConfiguration();
    
    if (!gcHostURL) {
      reject(new Error("gcHostOrigin is not set or invalid"));
      return;
    }

    const hostName = new URL(gcHostURL).hostname;
    const parts = hostName.split('.');
    parts.shift();
    window.environment = parts.join('.');

    const platformClient = require('platformClient');
    const client = platformClient.ApiClient.instance;
    const usersApi = new platformClient.UsersApi();

    const ClientApp = window.purecloud.apps.ClientApp;
    window.myClientApp = new ClientApp({
      pcEnvironment: window.environment
    });

    client.setPersistSettings(true, appName);
    client.setEnvironment(window.environment);
    
    client.loginImplicitGrant(clientId, redirectUri)
      .then(() => usersApi.getUsersMe())
      .then(() => resolve(platformClient))
      .catch(reject);
  });
}

function assignConfiguration() {
  const searchParams = new URLSearchParams(window.location.search);
  const appName = 'Monitor alerts';

  window.conversationId = searchParams.get('conversationId') || '';
  
  const gcHostOrigin = searchParams.get('gcHostOrigin') || 
                      localStorage.getItem(`${appName}_gcHostOrigin`);
  
  if (gcHostOrigin) {
    localStorage.setItem(`${appName}_gcHostOrigin`, gcHostOrigin);
  }

  return gcHostOrigin;
}
