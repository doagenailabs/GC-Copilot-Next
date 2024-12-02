import './globals.css'

export const metadata = {
  title: 'GC Copilot Next',
  description: 'GC Copilot Next',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script 
          src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"
          strategy="beforeInteractive"
        />
        <script 
          src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.3/purecloud-client-app-sdk-de77761d.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
