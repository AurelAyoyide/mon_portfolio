import type { Metadata } from 'next'
import './globals.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { GoogleAnalytics } from '@next/third-parties/google'

config.autoAddCss = false

export const metadata: Metadata = {
  metadataBase: new URL('https://aurelayoyide.netlify.app'),
  title: 'Aurel AYOYIDE | Développeur Fullstack & Desktop',
  description: 'Développeur Fullstack & Desktop passionné. Expert en React, Next.js, Vue.js, NestJS, Laravel, C# et VB.NET. Création d\'applications web modernes et logiciels desktop performants. Basé à Cotonou, Bénin.',
  keywords: 'Aurel AYOYIDE, Développeur Fullstack, Desktop Developer, React, Next.js, Vue.js, NestJS, Laravel, C#, VB.NET, TypeScript, JavaScript, MongoDB, MySQL, Cotonou, Bénin',
  authors: [{ name: 'Aurel AYOYIDE' }],
  openGraph: {
    type: 'website',
    url: 'https://aurelayoyide.netlify.app',
    siteName: 'Aurel AYOYIDE',
    title: 'Aurel AYOYIDE | Développeur Fullstack & Desktop',
    description: 'Développeur passionné spécialisé en développement web moderne et applications desktop. Expert React, Next.js, Vue.js, C# et VB.NET.',
    images: [
      {
        url: '/image/social-cover.png',
        width: 1200,
        height: 630,
        alt: 'Aurel AYOYIDE - Développeur Fullstack & Desktop',
      },
    ],
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aurel AYOYIDE | Développeur Fullstack & Desktop',
    description: 'Développeur passionné spécialisé en développement web moderne et applications desktop. Expert React, Next.js, Vue.js, C# et VB.NET.',
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
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  )
}
