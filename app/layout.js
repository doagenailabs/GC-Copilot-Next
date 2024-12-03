import { AppProvider } from '../components/AppProvider';
import Script from 'next/script';

export const metadata = {
  title: 'GCCopilotNext',
  description: 'Genesys Cloud Copilot App',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://sdk-cdn.mypurecloud.com/javascript/208.0.0/purecloud-platform-client-v2.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://sdk-cdn.mypurecloud.com/javascript/purecloud-client-app-sdk-v54.0.0.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
