export const metadata = {
  title: 'Always',
  description: 'Keep your run of show always in your team\'s hands',
  openGraph: {
    title: 'Always - Up-to-date Run of Show',
    description: 'Keep your run of show always in your team\'s hands',
    url: 'https://always.sh',
    siteName: 'Always',
    images: [
      {
        url: 'https://always.sh/OpenGraph.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Always - Up-to-date Run of Show',
    description: 'Keep your run of show always in your team\'s hands',
    images: ['https://always.sh/OpenGraph.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 