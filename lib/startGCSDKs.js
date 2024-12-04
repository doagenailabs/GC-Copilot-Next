function startGCSDKs(clientId) {
    return new Promise((resolve, reject) => {
        try {
            // Core initialization parameters
            const appName = 'GCCopilotNext';
            const redirectUri = window.location.origin;
            const searchParams = new URLSearchParams(window.location.search);
            const gcHostOrigin = searchParams.get('gcHostOrigin');
            
            // Log initial parameters
            window.logger.debug('startGCSDKs', 'Initialization parameters:', {
                appName,
                clientId,
                redirectUri,
                gcHostOrigin,
                windowLocation: window.location.href,
                searchParams: Object.fromEntries(searchParams.entries())
            });

            // Determine environment
            let environment = 'mypurecloud.com'; // default
            if (gcHostOrigin) {
                try {
                    const hostName = new URL(gcHostOrigin).hostname;
                    const parts = hostName.split('.');
                    parts.shift();
                    environment = parts.join('.');
                    window.logger.debug('startGCSDKs', 'Environment determined from gcHostOrigin:', {
                        gcHostOrigin,
                        hostName,
                        parts,
                        environment
                    });
                } catch (error) {
                    window.logger.warn('startGCSDKs', 'Failed to parse gcHostOrigin URL:', {
                        gcHostOrigin,
                        error: error.message,
                        usingDefault: environment
                    });
                }
            } else {
                window.logger.warn('startGCSDKs', 'No gcHostOrigin provided, using default environment:', {
                    environment
                });
            }

            // Get platformClient using require pattern
            window.logger.debug('startGCSDKs', 'Initializing platformClient');
            const platformClient = require('platformClient');
            
            window.logger.debug('startGCSDKs', 'Checking platformClient initialization:', {
                hasApiClient: !!platformClient?.ApiClient,
                hasUsersApi: !!platformClient?.UsersApi,
                availableMethods: Object.keys(platformClient || {})
            });

            const client = platformClient.ApiClient.instance;
            const usersApi = new platformClient.UsersApi();

            // Initialize ClientApp
            window.logger.debug('startGCSDKs', 'Initializing ClientApp');
            const ClientApp = window.purecloud.apps.ClientApp;
            const myClientApp = new ClientApp({
                gcHostOriginQueryParam: 'gcHostOrigin',
                gcTargetEnvQueryParam: 'gcTargetEnv'
            });

            window.logger.debug('startGCSDKs', 'ClientApp initialization state:', {
                clientAppExists: !!ClientApp,
                myClientAppExists: !!myClientApp,
                hasAlerting: !!myClientApp?.alerting,
                gcEnvironment: myClientApp?.gcEnvironment
            });
            
            // Store ClientApp reference
            window.myClientApp = myClientApp;

            // Configure client
            window.logger.debug('startGCSDKs', 'Configuring API client:', {
                appName,
                environment,
                isPersistEnabled: client.persistSettings
            });

            client.setPersistSettings(true, appName);
            client.setEnvironment(environment);

            // Start authentication flow
            client.loginImplicitGrant(clientId, redirectUri)
                .then(() => {
                    window.logger.debug('startGCSDKs', 'Implicit grant successful, fetching user details');
                    return usersApi.getUsersMe();
                })
                .then(data => {
                    window.userDetails = data;
                    window.logger.info('startGCSDKs', 'Authentication complete:', {
                        userName: data.name,
                        userId: data.id,
                        email: data.email
                    });

                    // Show welcome notification
                    myClientApp.alerting.showToastPopup(
                        'Welcome',
                        `Hello ${data.name}`
                    );
                    window.logger.debug('startGCSDKs', 'Welcome toast displayed');

                    resolve(platformClient);
                })
                .catch(err => {
                    window.logger.error('startGCSDKs', 'Authentication failed:', {
                        error: err.message,
                        stack: err.stack,
                        clientId,
                        redirectUri,
                        environment
                    });
                    reject(err);
                });

        } catch (error) {
            window.logger.error('startGCSDKs', 'Critical initialization error:', {
                error: error.message,
                stack: error.stack,
                phase: 'initialization'
            });
            reject(error);
        }
    });
}
