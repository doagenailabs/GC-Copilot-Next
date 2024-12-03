import { AppProvider } from '../components/AppProvider';

export const metadata = {
  title: 'GCCopilotNext',
  description: 'Genesys Cloud Copilot Next.js Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
