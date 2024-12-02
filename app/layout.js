import ScriptsLoader from '../components/ScriptsLoader';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Other head elements */}
      </head>
      <body>{children}</body>
    </html>
  );
}
