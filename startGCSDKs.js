function startGCSDKs(clientId) {
    const console = window.console;
    return new Promise((resolve, reject) => {
        const appName = 'Monitor alerts';
        const qParamLanguage = 'langTag';
        const qParamGcHostOrigin = 'gcHostOrigin';
        const qParamEnvironment = 'gcTargetEnv';
        const qParamConversationId = 'conversationId';
        let language = '';  
        let redirectUri = 'https://gc-call-monitor-agent-alert.vercel.app';
        let userDetails = null;
        let gcHostOrigin = '';
        let conversationId = '';
        let gcHostURL = assignConfiguration();

        // Ensure the gcHostOrigin is a valid URL before creating a new URL instance
        let hostName;
        if (gcHostURL) {
            try {
                hostName = new URL(gcHostURL).hostname;
            } catch (error) {
                console.error("startGCSDKs.js - Invalid gcHostOrigin URL:", gcHostOrigin);
                reject(error);
                return;
            }
        } else {
            console.log("startGCSDKs.js - gcHostOrigin is not set or invalid");
            reject(new Error("gcHostOrigin is not set or invalid"));
            return;
        }

        const parts = hostName.split('.');
        parts.shift();
        window.environment = parts.join('.'); // Example environment value = "mypurecloud.ie" 
        console.log('startGCSDKs.js - window.environment in startGCSDKs:', window.environment);

        const platformClient = require('platformClient');
        const client = platformClient.ApiClient.instance;

        document.addEventListener('DOMContentLoaded', function () {
            var ClientApp = window.purecloud.apps.ClientApp;
            var myClientApp = new ClientApp({
                gcHostOriginQueryParam: 'gcHostOrigin',
                gcTargetEnvQueryParam: 'gcTargetEnv'
            });
            const region = myClientApp.gcEnvironment;
        });

        const usersApi = new platformClient.UsersApi();
        let ClientApp = window.purecloud.apps.ClientApp;
        let myClientApp = new ClientApp({
            pcEnvironment: window.environment
        });
        window.myClientApp = myClientApp; 
        client.setPersistSettings(true, appName);
        client.setEnvironment(window.environment);
        client.loginImplicitGrant(clientId, redirectUri)
            .then(data => usersApi.getUsersMe())
            .then(data => {   
                userDetails = data;
            })
            .then(() => {
                document.addEventListener('DOMContentLoaded', () => {
                    document.getElementById('span_environment').innerText = window.environment;
                    document.getElementById('span_language').innerText = language;
                    document.getElementById('span_name').innerText = userDetails.name;
                });
                resolve(platformClient);
            })
            .catch((err) => {
                console.error("startGCSDKs.js - Error during setup:", err);
                reject(err);
            });

        function assignConfiguration() {
            let browser_url = window.location.href;
            if (!browser_url) {
                console.log('startGCSDKs.js - Browser URL is null or undefined.');
                return null;
            }
            let searchParams;
            try {
                let url = new URL(browser_url);
                searchParams = new URLSearchParams(url.search);
            } catch (error) {
                console.error('startGCSDKs.js - Failed to parse the URL:', browser_url);
                return null;
            }
            
            console.log('startGCSDKs.js - browser_url: ', browser_url);
            console.log('startGCSDKs.js - searchParams: ', searchParams);
            
            if (searchParams.has(qParamConversationId)) {
                conversationId = searchParams.get(qParamConversationId);
                window.conversationId = conversationId; 
                console.log('startGCSDKs.js - Conversation ID set from URL parameter:', conversationId);
            } else {
                console.log('startGCSDKs.js - Conversation ID not found in URL parameters.');
            }

            if (searchParams.has(qParamLanguage)) {
                language = searchParams.get(qParamLanguage);
                localStorage.setItem(`${appName}_language`, language);
                console.log('startGCSDKs.js - Language set from URL parameter:', language);
            } else {
                let local_lang = localStorage.getItem(`${appName}_language`);
                if (local_lang) {
                    language = local_lang;
                    console.log('startGCSDKs.js - Language set from localStorage:', language);
                } else {
                    console.log('startGCSDKs.js - Language not found in both URL parameters and localStorage.');
                }
            }
            if (searchParams.has(qParamGcHostOrigin)) {
                gcHostOrigin = searchParams.get(qParamGcHostOrigin);
                localStorage.setItem(`${appName}_gcHostOrigin`, gcHostOrigin);
                console.log('startGCSDKs.js - gcHostOrigin set from URL parameter:', gcHostOrigin);
                return gcHostOrigin;
            } else {
                let local_gcHostOrigin = localStorage.getItem(`${appName}_gcHostOrigin`);
                if (local_gcHostOrigin) {
                    gcHostOrigin = local_gcHostOrigin;
                    console.log('startGCSDKs.js - gcHostOrigin set from localStorage:', gcHostOrigin);
                    return gcHostOrigin;
                } else {
                    console.log('startGCSDKs.js - gcHostOrigin not found in both URL parameters and localStorage.');
                    return null;
                }
            }
        }
    });
}
