function startGCSDKs() {
    return new Promise((resolve, reject) => {
        try {
            window.logger.debug('startGCSDKs', 'Starting SDK initialization');
            
            const platformClient = require('platformClient');
            const client = platformClient.ApiClient.instance;
            const usersApi = new platformClient.UsersApi();

            window.logger.debug('startGCSDKs', 'Platform client initialized via require');

            // Initialize ClientApp
            const ClientApp = window.purecloud.apps.ClientApp;
            const myClientApp = new ClientApp({
                gcHostOriginQueryParam: 'gcHostOrigin',
                gcTargetEnvQueryParam: 'gcTargetEnv'
            });

            // Store references if needed
            window.myClientApp = myClientApp;
            window.platformClient = platformClient;
            const appName = window.GENESYS_CONFIG.appName;
            const redirectUri = window.GENESYS_CONFIG.redirectUri;
            const environment = window.GENESYS_CONFIG.defaultEnvironment;
            const clientId = window.GENESYS_CONFIG.clientId;

            window.logger.debug('startGCSDKs', 'Configuring client with:', {
                appName,
                environment,
                redirectUri
            });

            client.setPersistSettings(true, appName);
            client.setEnvironment(environment);

            window.logger.debug('startGCSDKs', 'Starting implicit grant flow');

            client.loginImplicitGrant(clientId, redirectUri)
                .then(() => usersApi.getUsersMe())
                .then(data => {
                    window.userDetails = data;
                    window.logger.info('startGCSDKs', `Logged in as ${data.name}`);

                    // Show welcome notification
                    myClientApp.alerting.showToastPopup(
                        `Hello ${data.name}`,
                        'Welcome to GCCopilotNext'
                    );

                    resolve(platformClient);
                })
                .catch(err => {
                    window.logger.error('startGCSDKs', 'Error during setup:', err);
                    reject(err);
                });

        } catch (error) {
            window.logger.error('startGCSDKs', 'Critical error during SDK initialization:', error);
            reject(error);
        }
    });
}
