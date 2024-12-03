import { GenesysProvider } from '../components/GenesysProvider';
import GenesysScripts from '../components/GenesysScripts';

export const metadata = {
  title: 'GCCopilotNext',
  description: 'Genesys Cloud Copilot Next.js Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GenesysScripts />
        <GenesysProvider>
          {children}
        </GenesysProvider>
      </body>
    </html>
  );
}
