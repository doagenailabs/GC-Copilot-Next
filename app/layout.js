import './globals.css';

export const metadata = {
  title: 'GC Copilot Next',
  description: 'GC Copilot Next',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head></head>
      <body>{children}</body>
    </html>
  );
}
