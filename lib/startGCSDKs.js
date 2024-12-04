function startGCSDKs() {
    return new Promise((resolve, reject) => {
        // Wait for both SDKs to be fully loaded
        if (!window.purecloud || !window.platformClient) {
            window.logger.error('startGCSDKs', 'SDKs not loaded');
            reject(new Error('Genesys Cloud SDKs not loaded'));
            return;
        }

        const appName = window.GENESYS_CONFIG.appName;
        const redirectUri = window.GENESYS_CONFIG.redirectUri;
        const environment = window.GENESYS_CONFIG.defaultEnvironment;
        const clientId = window.GENESYS_CONFIG.clientId;

        // Use the globally loaded platformClient instead of requiring it
        const platformClient = window.platformClient;
        const client = platformClient.ApiClient.instance;
        const usersApi = new platformClient.UsersApi();

        // Initialize ClientApp after ensuring SDK is loaded
        const ClientApp = window.purecloud.apps.ClientApp;
        const myClientApp = new ClientApp({
            gcHostOriginQueryParam: 'gcHostOrigin',
            gcTargetEnvQueryParam: 'gcTargetEnv'
        });
        
        // Store ClientApp instance globally
        window.myClientApp = myClientApp;

        // Configure the client
        client.setPersistSettings(true, appName);
        client.setEnvironment(environment);

        // Login sequence
        client.loginImplicitGrant(clientId, redirectUri)
            .then(() => usersApi.getUsersMe())
            .then(data => {
                window.userDetails = data;
                window.logger.info('startGCSDKs', 'User authenticated successfully:', {
                    name: data.name,
                    id: data.id
                });

                // Show welcome notification only after successful setup
                if (window.myClientApp && window.myClientApp.alerting) {
                    myClientApp.alerting.showToastPopup(
                        `Hello ${data.name}`,
                        'Welcome to GCCopilotNext'
                    );
                }

                resolve(platformClient);
            })
            .catch(err => {
                window.logger.error('startGCSDKs', 'Error during setup:', err);
                reject(err);
            });
    });
}
