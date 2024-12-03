import Script from 'next/script';
import { GenesysProvider } from '../components/GenesysProvider';
import { logger } from '../lib/logging';

const COMPONENT = 'RootLayout';

export const metadata = {
  title: 'GCCopilotNext',
  description: 'Genesys Cloud Copilot Next.js Application',
};

const handleScriptLoad = (scriptName) => () => {
  logger.log(COMPONENT, `${scriptName} loaded successfully`);
};

const handleScriptError = (scriptName) => (error) => {
  logger.error(COMPONENT, `Error loading ${scriptName}:`, error);
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"
          strategy="beforeInteractive"
          id="gc-platform-sdk"
          onLoad={handleScriptLoad('Platform SDK')}
          onError={handleScriptError('Platform SDK')}
        />
        <Script
          src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.7/purecloud-client-app-sdk.js"
          strategy="beforeInteractive"
          id="gc-client-app-sdk"
          onLoad={handleScriptLoad('Client App SDK')}
          onError={handleScriptError('Client App SDK')}
        />
        <GenesysProvider>
          {children}
        </GenesysProvider>
      </body>
    </html>
  );
}
