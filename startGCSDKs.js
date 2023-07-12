function startGCSDKs(clientId) {
  const console = window.console;
  return new Promise((resolve, reject) => {
    const appName = 'app name';
    const qParamLanguage = 'language';
    const qParamEnvironment = 'environment';

    let language = 'en-us';
    let redirectUri = 'https://doailabs.github.io/GC-CLM/';
    let userDetails = null;
    let environment = "mypurecloud.de";

    window.addEventListener('load', (event) => {
      assignConfiguration();
      console.log(`environment after addEventListener: ${environment}`);
      console.log(`language after addEventListener: ${language}`);

      const platformClient = require('platformClient');
      const client = platformClient.ApiClient.instance;
      document.addEventListener('DOMContentLoaded', function () {
        var ClientApp = window.purecloud.apps.ClientApp;
        var myClientApp = new ClientApp({
          gcHostOriginQueryParam: 'gcHostOrigin',
          gcTargetEnvQueryParam: 'gcTargetEnv'
        });
        myClientApp.alerting.showToastPopup('Hello', 'Genesys Cloud');
        const region = myClientApp.gcEnvironment;
      });

      const usersApi = new platformClient.UsersApi();

      let ClientApp = window.purecloud.apps.ClientApp;
      let myClientApp = new ClientApp({
        pcEnvironment: environment
      });

      client.setPersistSettings(true, appName);
      client.setEnvironment(environment);

      client.loginImplicitGrant(clientId, redirectUri)
        .then(data => usersApi.getUsersMe())
        .then(data => {
          userDetails = data;

          myClientApp.alerting.showToastPopup(
            `Hola ${userDetails.name}`,
            'Bienvenido a contact list management');
        })
        .then(() => {
          document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('span_environment').innerText = environment;
            document.getElementById('span_language').innerText = language;
            document.getElementById('span_name').innerText = userDetails.name;
          });

          console.log('Finished setup.');
          resolve(platformClient);
        })
        .catch((err) => {
          console.error("Error during setup:", err);
          reject(err);
        });
    });

    function assignConfiguration() {
      let url = new URL(window.location);
      let searchParams = new URLSearchParams(url.search);

      if (searchParams.has(qParamLanguage)) {
        language = searchParams.get(qParamLanguage);
        localStorage.setItem(`${appName}_language`, language);
      } else {
        let local_lang = localStorage.getItem(`${appName}_language`);
        if (local_lang) language = local_lang;
      }
      if (searchParams.has(qParamEnvironment)) {
        environment = searchParams.get(qParamEnvironment);
        localStorage.setItem(`${appName}_environment`, environment);
      } else {
        let local_env = localStorage.getItem(`${appName}_environment`);
        if (local_env) environment = local_env;
      }
      return (environment);
    }
  });
}
