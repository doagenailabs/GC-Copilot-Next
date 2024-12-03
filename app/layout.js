import Script from 'next/script';
import { GenesysProvider } from '../components/GenesysProvider';

export const metadata = {
  title: 'GCCopilotNext',
  description: 'Genesys Cloud Copilot Next.js Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"
          strategy="beforeInteractive"
          id="gc-platform-sdk"
        />
        <Script
          src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.7/purecloud-client-app-sdk.js"
          strategy="beforeInteractive"
          id="gc-client-app-sdk"
        />
        <GenesysProvider>
          {children}
        </GenesysProvider>
      </body>
    </html>
  );
}
