import './globals.css'

export const metadata = {
  title: 'Monitor alerts',
  description: 'Genesys Cloud monitor alerts application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://sdk-cdn.mypurecloud.com/javascript/latest/purecloud-platform-client-v2.min.js"></script>
        <script src="https://sdk-cdn.mypurecloud.com/client-apps/2.6.3/purecloud-client-app-sdk-de77761d.min.js"></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
