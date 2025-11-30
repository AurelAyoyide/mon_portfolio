import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aurel AYOYIDE | AurelOS Terminal',
  description: 'Portfolio interactif sous forme de terminal - Développeur Fullstack & Desktop',
}

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap" rel="stylesheet" />
      {children}
    </>
  )
}
