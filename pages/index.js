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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

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

        const userData = await response.json();
        console.log('Auth response received:', userData);
        
        const eventIds = Object.keys(userData.events);
        console.log('Event IDs:', eventIds);

        setUser(userData);
        setLoading(false);

        if (!router.query.eventId && eventIds.length > 0) {
          const lastVisited = localStorage.getItem('lastVisited');
          const targetEventId = lastVisited && eventIds.includes(lastVisited) 
            ? lastVisited 
            : eventIds[0];
            
          console.log('Attempting redirect to event:', targetEventId);
          await router.push(`/?eventId=${targetEventId}&tab=Run%20of%20Show`);
          setSelectedEventId(targetEventId);
          setSelectedEvent(userData.events[targetEventId]);
          localStorage.setItem('lastVisited', targetEventId);
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/signup');
      }
    }

    authenticate();
  }, []);

  useEffect(() => {
    if (user && eventId && user.events[eventId]) {
      setSelectedEventId(eventId);
      setSelectedEvent(user.events[eventId]);
      localStorage.setItem('lastVisited', eventId);
    }
  }, [user, eventId]);

  console.log('Current router query:', router.query);
  console.log('Current loading state:', loading);
  console.log('Current user state:', user);

  const handleUserUpdate = (updatedUser, eventId) => {
    setUser(updatedUser);
    if (eventId) {
      setSelectedEventId(eventId);
      setSelectedEvent(updatedUser.events[eventId]);
    }
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
          selectedEventId={selectedEventId}
          onEventSelect={(eventId) => {
            setSelectedEventId(eventId);
            setSelectedEvent(user.events[eventId]);
          }}
        />
        {currentTab == "Run of Show" && 
        <div style={{
          flex: 1,
          display: "flex",
          color: "#59636E",
          position: "relative"
        }}>
          {(() => {
            // Safety check for selectedEvent and valid dates
            if (!selectedEvent?.startTime || !selectedEvent?.endTime) {
              return null;
            }

            // Calculate total hours between start and end time
            const startDate = new Date(selectedEvent.startTime);
            const endDate = new Date(selectedEvent.endTime);
            const hoursDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60));

            // Validate hoursDiff is a positive number
            if (!hoursDiff || hoursDiff < 0 || !Number.isFinite(hoursDiff)) {
              return null;
            }
            
            return (
              <>
                {/* Fixed Event Schedule Column */}
                <div style={{
                  display: "flex", 
                  flexDirection: "column", 
                  flexShrink: 0,
                  position: "sticky",
                  left: 0,
                  backgroundColor: "white",
                  zIndex: 1
                }}>
                  <p style={{
                    margin: 0, 
                    height: 22, 
                    width: 185,
                    borderRight: "1px solid #EBEBEB", 
                    borderBottom: "1px solid #EBEBEB", 
                    paddingLeft: 32, 
                    paddingTop: 6, 
                    paddingBottom: 5
                  }}>Event Schedule</p>
                  {Array.from({ length: hoursDiff }).map((_, index) => {
                    const cellTime = new Date(startDate.getTime() + (index * 60 * 60 * 1000));
                    return (
                      <div key={index} style={{
                        width: 217,
                        position: "relative",
                        height: 100,
                        borderRight: "1px solid #EBEBEB",
                        borderBottom: "1px solid #EBEBEB",
                        flexShrink: 0
                      }}>
                        <p style={{position: "absolute",
                        fontSize: 9,
                        paddingLeft: 2,
                        width: 28, 
                        marginTop: -6,
                        backgroundColor: "#fff"

                        }}>
                          {cellTime.toLocaleTimeString('en-US', { 
                          hour: 'numeric',
                          timeZone: 'UTC',
                          hour12: true 
                        })}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Scrollable section */}
                <div style={{
                  display: "flex",
                  overflowX: "auto"
                }}>
                  {/* You Column */}
                  <div style={{display: "flex", flexDirection: "column", flexShrink: 0}}>
                    <p style={{
                      margin: 0, 
                      height: 22, 
                      width: 201,
                      borderRight: "1px solid #EBEBEB", 
                      borderBottom: "1px solid #EBEBEB", 
                      paddingLeft: 16, 
                      paddingTop: 6, 
                      paddingBottom: 5
                    }}>You</p>
                    {Array.from({ length: hoursDiff }).map((_, index) => (
                      <div key={index} style={{
                        width: 217,
                        height: 100,
                        borderRight: "1px solid #EBEBEB",
                        borderBottom: "1px solid #EBEBEB",
                        flexShrink: 0
                      }}></div>
                    ))}
                  </div>

                  {/* Team Member Columns */}
                  {selectedEvent?.teamMembers?.map((teamMember) => (
                    <div key={teamMember.id} style={{display: "flex", flexDirection: "column", flexShrink: 0}}>
                      <p style={{
                        margin: 0, 
                        height: 22, 
                        width: 201,
                        borderRight: "1px solid #EBEBEB",
                        borderBottom: "1px solid #EBEBEB",
                        paddingLeft: 16,
                        paddingTop: 6,
                        paddingBottom: 5
                      }}>{teamMember.name}</p>
                      {Array.from({ length: hoursDiff }).map((_, index) => (
                        <div key={index} style={{
                          width: 217,
                          height: 100,
                          borderRight: "1px solid #EBEBEB",
                          borderBottom: "1px solid #EBEBEB",
                          flexShrink: 0
                        }}></div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>        
        }
        {currentTab != "Run of Show" && 

        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          color: "#59636E"
        }}>
          {currentTab}
        </div>}
      </div>
    </>
  );
}
