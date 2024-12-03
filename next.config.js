const withTM = require('next-transpile-modules')([
  'purecloud-platform-client-v2',
  'purecloud-client-app-sdk',
]);

module.exports = withTM({
  reactStrictMode: true,
});
