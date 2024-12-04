function startGCSDKs(clientId) {
    return new Promise((resolve, reject) => {
        try {
            // Core initialization parameters
            const appName = 'GCCopilotNext';
            const redirectUri = window.location.origin;
            const searchParams = new URLSearchParams(window.location.search);
            let gcHostOrigin = searchParams.get('gcHostOrigin');

            // If gcHostOrigin is not in URL params, try to get it from sessionStorage
            if (!gcHostOrigin) {
                gcHostOrigin = sessionStorage.getItem('gcHostOrigin');
                window.logger.debug('startGCSDKs', 'Retrieved gcHostOrigin from sessionStorage:', { gcHostOrigin });
            }

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
            let environment;
            if (gcHostOrigin) {
                try {
                    const hostName = new URL(gcHostOrigin).hostname;
                    const parts = hostName.split('.');
                    parts.shift(); // Remove the 'apps' subdomain
                    environment = parts.join('.');

                    // Store for future use
                    sessionStorage.setItem('gcHostOrigin', gcHostOrigin);

                    window.logger.debug('startGCSDKs', 'Environment determined from gcHostOrigin:', {
                        gcHostOrigin,
                        hostName,
                        parts,
                        environment
                    });
                } catch (error) {
                    window.logger.error('startGCSDKs', 'Failed to parse gcHostOrigin URL:', {
                        gcHostOrigin,
                        error: error.message
                    });
                    reject(new Error('Invalid gcHostOrigin URL'));
                    return;
                }
            } else {
                window.logger.error('startGCSDKs', 'No gcHostOrigin provided. Cannot proceed without environment information');
                reject(new Error('Missing gcHostOrigin parameter'));
                return;
            }

            // Get platformClient using require pattern
            window.logger.debug('startGCSDKs', 'Initializing platformClient');
            const platformClient = require('platformClient');

            const client = platformClient.ApiClient.instance;
            const usersApi = new platformClient.UsersApi();

            // Initialize ClientApp with environment
            window.logger.debug('startGCSDKs', 'Initializing ClientApp with environment:', { environment });
            const ClientApp = window.purecloud.apps.ClientApp;
            const myClientApp = new ClientApp({
                pcEnvironment: environment
            });

            window.logger.debug('startGCSDKs', 'ClientApp initialization state:', {
                clientAppExists: !!ClientApp,
                myClientAppExists: !!myClientApp,
                hasAlerting: !!myClientApp?.alerting,
                environment: environment,
                gcEnvironment: myClientApp?.gcEnvironment
            });

            // Store ClientApp reference
            window.myClientApp = myClientApp;

            // Configure client
            client.setPersistSettings(true, appName);
            client.setEnvironment(environment);

            window.logger.info('startGCSDKs', 'Starting authentication flow:', {
                clientId,
                redirectUri,
                environment
            });

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
