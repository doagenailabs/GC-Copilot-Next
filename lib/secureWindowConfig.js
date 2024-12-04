(function() {
  const createSecureConfig = (config, name) => {
    Object.defineProperty(window, name, {
      value: Object.freeze(config),
      writable: false,
      configurable: false
    });
  };

  // Secure GENESYS_CONFIG
  createSecureConfig({
    clientId: '',
    redirectUri: window.location.origin,
    appName: 'GCCopilotNext',
    defaultEnvironment: 'mypurecloud.ie',
    defaultLanguage: 'en-us'
  }, 'GENESYS_CONFIG');

  // Secure jsonSchema
  createSecureConfig(jsonSchema, 'jsonSchema');

  // Secure systemPrompt
  createSecureConfig(systemPrompt, 'systemPrompt');
})();
