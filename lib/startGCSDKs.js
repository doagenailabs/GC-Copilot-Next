function startGCSDKs(clientId) {
    return new Promise((resolve, reject) => {
        const appName = 'GCCopilotNext';
        const redirectUri = window.location.origin;
        let gcHostOrigin = new URLSearchParams(window.location.search).get('gcHostOrigin');
        
        let environment = 'mypurecloud.com';
        if (gcHostOrigin) {
            try {
                const hostName = new URL(gcHostOrigin).hostname;
                const parts = hostName.split('.');
                parts.shift();
                environment = parts.join('.');
            } catch (error) {
                window.logger.warn('startGCSDKs', 'Invalid gcHostOrigin, using default environment');
            }
        }
        
        window.logger.debug('startGCSDKs', 'Initializing with:', { environment, gcHostOrigin });

        // Get platformClient using require pattern
        const platformClient = require('platformClient');
        const client = platformClient.ApiClient.instance;
        const usersApi = new platformClient.UsersApi();

        // Initialize ClientApp
        const ClientApp = window.purecloud.apps.ClientApp;
        const myClientApp = new ClientApp({
            gcHostOriginQueryParam: 'gcHostOrigin',
            gcTargetEnvQueryParam: 'gcTargetEnv'
        });
        
        // Store ClientApp reference
        window.myClientApp = myClientApp;

        // Configure client
        client.setPersistSettings(true, appName);
        client.setEnvironment(environment);

        window.logger.debug('startGCSDKs', 'Starting authentication');

        // Start authentication flow
        client.loginImplicitGrant(clientId, redirectUri)
            .then(() => usersApi.getUsersMe())
            .then(data => {
                window.userDetails = data;
                window.logger.info('startGCSDKs', `Logged in as ${data.name}`);
                // Show welcome notification
                myClientApp.alerting.showToastPopup(
                    'Welcome',
                    `Hello ${data.name}`
                );
                resolve(platformClient);
            })
            .catch(err => {
                window.logger.error('startGCSDKs', 'Authentication failed:', err);
                reject(err);
            });
    });
}
