import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marjo Ballabani | Terminal Resume',
  description: 'Interactive terminal-style resume of Marjo Ballabani - Senior Software Engineer',
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
