import Script from 'next/script'
import './globals.css'

export const metadata = {
  title: 'GC Copilot Next',
  description: 'GC Copilot Next',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
        />
        <Script
          src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.3/purecloud-client-app-sdk.js"
          strategy="beforeInteractive"
          crossOrigin="anonymous"
          onLoad={() => {
            window.pcSDKLoaded = true;
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
