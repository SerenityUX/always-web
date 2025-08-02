import "../styles/globals.css";
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Always</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Plausible Analytics */}
        <script
          defer
          data-domain="always.sh"
          src="https://plausible.io/js/script.js"
        />

        <script defer data-domain="always.sh" src="http://plausible-j80w0c4gg0gco4gwo0ocgsss.5.78.111.174.sslip.io/js/script.js"></script>

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Always - Up-to-date Run of Show" />
        <meta property="og:description" content="Keep your run of show always in your team's hands" />
        <meta property="og:image" content="https://always.sh/OpenGraph.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://always.sh" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://always.sh/OpenGraph.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
