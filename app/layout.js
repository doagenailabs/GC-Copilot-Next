import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
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
        {children}
      </body>
    </html>
  );
}
