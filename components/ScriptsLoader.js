'use client';

import Script from 'next/script'

export default function ScriptsLoader() {
  return (
    <>
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
    </>
  );
}
