import './globals.css'

export const metadata = {
  title: 'GC Copilot Next', 
  description: 'GC Copilot Next',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"></script>
        <script src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.7/purecloud-client-app-sdk.js"></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
