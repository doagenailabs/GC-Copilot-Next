function startGCSDKs(clientId) {
    return new Promise((resolve, reject) => {
        const appName = window.GENESYS_CONFIG.appName;
        const redirectUri = window.GENESYS_CONFIG.redirectUri;
        const environment = window.GENESYS_CONFIG.defaultEnvironment;

        const platformClient = window.platformClient = require('platformClient');
        const client = platformClient.ApiClient.instance;

        const usersApi = new platformClient.UsersApi();

        // Initialize ClientApp
        let ClientApp = window.purecloud.apps.ClientApp;
        let myClientApp = new ClientApp({
            gcHostOriginQueryParam: 'gcHostOrigin',
            gcTargetEnvQueryParam: 'gcTargetEnv'
        });
        window.myClientApp = myClientApp;

        client.setPersistSettings(true, appName);
        client.setEnvironment(environment);

        client.loginImplicitGrant(clientId, redirectUri)
            .then(() => usersApi.getUsersMe())
            .then(data => {
                window.userDetails = data;
                window.GENESYS_CONFIG.clientId = clientId; // Set the clientId
                resolve();
            })
            .catch(err => {
                console.error("startGCSDKs.js - Error during setup:", err);
                reject(err);
            });
    });
}
