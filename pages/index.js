import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Landing.module.css';

export default function Landing() {
  const router = useRouter();
  const [hasLoadedIfHasToken, setHasLoadedIfHasToken] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/event');
    } else {
      setHasLoadedIfHasToken(true);
    }
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Check on initial load
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (!hasLoadedIfHasToken) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Always</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Always - Up-to-date Run of Show" />
        <meta property="og:description" content="Keep your run of show always in your team's hands" />
        <meta property="og:image" content="/OpenGraph.png" />
        <meta property="og:url" content="https://always.sh" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/OpenGraph.png" />
      </Head>
      {hasLoadedIfHasToken &&
      <div style={{
        width: "100vw",
        display: "flex",
        color: "#492802",
        flexDirection: "column",
        backgroundColor: "#FEE353",
        height: "100vh",
        overflow: "hidden",
        margin: 0,
        fontFamily: "GT-Flexa-Variable, sans-serif",
        fontVariationSettings: "'wght' 400, 'slnt' 0"
      }}>
        <div style={{paddingTop: 16, alignItems: "center", display: "flex", flexDirection: "row", justifyContent: "space-between", paddingBottom: 16, paddingLeft: 32, paddingRight: 32}}>
        <div style={{display: 'flex', flexDirection: "row", gap: 16, alignItems: "center"}}>
          <img src="./appIcon.svg" style={{width: 44, height: 44}}/>
        <h1 style={{cursor: "default"}} className={styles.animatedHeading}>
          always
        </h1>
        </div>

        <div style={{display: 'flex', flexDirection: "row", gap: 16}}>
          <div>
          <p 
            onClick={() => router.push('/signup')}
            style={{
              fontSize: 18, 
              margin: 0, 
              padding: "4px 8px", 
              cursor: "pointer", 
              borderRadius: 8, 
              border: "1px solid #492802"
            }}
          >
            Signup
          </p>
          </div>
          <div>
          <p 
            onClick={() => router.push('/login')}
            style={{
              fontSize: 18, 
              margin: 0, 
              padding: "4px 8px", 
              cursor: "pointer", 
              borderRadius: 8, 
              color: "#FEE353", 
              backgroundColor: "#492802"
            }}
          >
            Login
          </p>
          </div>
        </div>

        </div>
        <div style={{width: "100%", minHeight: 48, height: "100%", display: "flex", alignItems: 'center', justifyContent: 'center', backgroundColor: "#492802"}}>
          <p style={{color: "#FEE353", lineHeight: 1, margin: 0,}}>“I spent the past couple years organizing events! I’m now making a better way to make your run of show.”</p>
        </div>

        <div className={styles.responsiveContainer}>
          <div className={styles.contentContainer}>
            <h2 style={{
              margin: 0, 
              fontSize: 50,
              fontFamily: "GT-Flaire-Variable",
              fontVariationSettings: "'wght' 600, 'FLAR' 100, 'slnt' 0"
            }}><i>always up-to-date</i></h2>
            <h1 style={{
              fontSize: 100,
              lineHeight: 1, 
              margin: 0,
              fontFamily: "GT-Flaire-Variable, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
              fontVariationSettings: "'wght' 700, 'FLAR' 100, 'slnt' 0"
            }}>Run of Show<br/> <i>always</i> in your<br/> team's hands</h1>
          </div>
          <img 
            className={styles.productImage} 
            src={isMobile ? "./mobileVersionProductAsset.svg" : "./productAsset.svg"}
            alt="Product demonstration"
          />
        </div>
      </div>}
    </>
  );
}
