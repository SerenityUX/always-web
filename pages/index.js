import Head from "next/head";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';

export default function Home() {
  const router = useRouter();
  const { tab, eventId } = router.query;
  const currentTab = tab || "runOfShow";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function authenticate() {
      console.log('Starting authentication...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to signup');
        router.push('/signup');
        return;
      }

      try {
        console.log('Calling /auth endpoint...');
        const response = await fetch('https://serenidad.click/hacktime/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const userData = await response.json();
        console.log('Auth response received:', userData);
        
        const eventIds = Object.keys(userData.events);
        console.log('Event IDs:', eventIds);

        setUser(userData);
        setLoading(false);

        if (eventIds.length > 0) {
          const lastVisited = localStorage.getItem('lastVisited');
          const targetEventId = lastVisited && eventIds.includes(lastVisited) 
            ? lastVisited 
            : eventIds[0];
            
          console.log('Attempting redirect to event:', targetEventId);
          await router.push(`/?eventId=${targetEventId}&tab=Run%20of%20Show`);
          console.log('Redirect completed');
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/signup');
      }
    }

    authenticate();
  }, []);

  console.log('Current router query:', router.query);
  console.log('Current loading state:', loading);
  console.log('Current user state:', user);

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return <div></div>;
  }

  return (
    <>
      <Head>
        <title>Hack Mind</title>
        <meta name="description" content="Dynamic Run of Show" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{width: "100%", height: "100vh", display: "flex", flexDirection: "column"}}>
        <Navigation 
          user={user} 
          onUserUpdate={handleUserUpdate} 
        />
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          color: "#59636E"
        }}>
          {currentTab}
        </div>
      </div>
    </>
  );
}
