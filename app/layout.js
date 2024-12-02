import SDKLoader from '../components/SDKLoader'
import './globals.css'

export const metadata = {
  title: 'GC Copilot Next',
  description: 'GC Copilot Next',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <SDKLoader />
        {children}
      </body>
    </html>
  )
}
