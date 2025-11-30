import type { Metadata } from 'next'
import './globals.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'

config.autoAddCss = false

export const metadata: Metadata = {
  metadataBase: new URL('https://marjoballabani.me'),
  title: 'Marjo Ballabani | Senior Software Engineer | Full-Stack & Cloud Expert',
  description: 'Senior Software Engineer with 11+ years of experience in distributed systems, microservices, and cloud technologies. Expert in Node.js, React, Python, Google Cloud. Based in Munich, Germany.',
  keywords: 'Marjo Ballabani, Software Engineer, Full-Stack Developer, Cloud Engineer, Microservices, Node.js, React, Python, Google Cloud, AWS, Distributed Systems, Munich, Germany',
  authors: [{ name: 'Marjo Ballabani' }],
  openGraph: {
    type: 'website',
    url: 'https://marjoballabani.me',
    siteName: 'Marjo Ballabani',
    title: 'Marjo Ballabani | Senior Software Engineer',
    description: 'Senior Software Engineer with 11+ years of experience in distributed systems, cloud technologies, and full-stack development.',
    images: [
      {
        url: '/image/social-cover.png',
        width: 1200,
        height: 630,
        alt: 'Marjo Ballabani - Senior Software Engineer',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marjo Ballabani | Senior Software Engineer',
    description: 'Senior Software Engineer with 11+ years of experience in distributed systems, cloud technologies, and full-stack development.',
    images: ['/image/social-cover.png'],
  },
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Space+Grotesk:wght@300..700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
