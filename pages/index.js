import Head from "next/head";
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Navigation from '../components/Navigation';

export default function Home() {
  const router = useRouter();
  const { tab, eventId } = router.query;
  const currentTab = tab || "runOfShow";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [isInvitingNewUser, setIsInvitingNewUser] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    roleDescription: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [invalidEmail, setInvalidEmail] = useState(false);

  const emailInputRef = useRef(null);

  useEffect(() => {
    if (isInvitingNewUser && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [isInvitingNewUser]);

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

  const handleInviteChange = async (e) => {
    const { name, value } = e.target;
    setInviteForm(prev => ({ ...prev, [name]: value }));
    setInviteError('');
    setInvalidEmail(false);

    // Check if user exists when email is entered
    if (name === 'email' && value) {
      try {
        const response = await fetch(`https://serenidad.click/hacktime/checkUser/${value}`);
        const data = await response.json();
        
        // Check if user is already a team member
        const isExistingMember = selectedEvent?.teamMembers?.some(
          member => member.email.toLowerCase() === value.toLowerCase()
        );

        if (isExistingMember) {
          setInviteError('This person is already a team member');
          setInvalidEmail(true);
        } else if (data.exists) {
          setInviteForm(prev => ({ ...prev, name: data.name }));
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    }
  };

  const handleInviteSubmit = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      setInviteError('Email and name are required');
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch('https://serenidad.click/hacktime/inviteToEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          inviteeEmail: inviteForm.email,
          inviteeName: inviteForm.name,
          roleDescription: inviteForm.roleDescription,
          eventId: selectedEventId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }

      // Update local state with new team member
      setSelectedEvent(prev => ({
        ...prev,
        teamMembers: [...(prev.teamMembers || []), {
          id: data.user.email, // Using email as ID
          name: data.user.name,
          email: data.user.email,
          roleDescription: data.user.roleDescription,
          profilePicture: data.user.profilePicture
        }]
      }));

      // Close the invite modal
      setIsInvitingNewUser(false);
    } catch (error) {
      setInviteError(error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (
        e.key === 'Escape' && 
        isInvitingNewUser && 
        document.activeElement.tagName !== 'INPUT' && 
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        setIsInvitingNewUser(false);
        setInviteForm({ email: '', name: '', roleDescription: '' }); // Reset form
        setInviteError(''); // Clear any errors
        setInvalidEmail(false); // Reset invalid email state
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isInvitingNewUser]); // Only re-run if isInvitingNewUser changes

  useEffect(() => {
    const handlePlusKey = (e) => {
      if (
        e.key === '+' && 
        document.activeElement.tagName !== 'INPUT' && 
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault(); // Prevent the '+' from being typed
        setIsInvitingNewUser(true);
      }
    };

    document.addEventListener('keydown', handlePlusKey);
    return () => document.removeEventListener('keydown', handlePlusKey);
  }, []); // Empty dependency array since we don't need to re-run this effect

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
        {isInvitingNewUser && (
          <div 
            onClick={(e) => {
              // Only close if clicking the background (not the modal itself)
              if (e.target === e.currentTarget) {
                setIsInvitingNewUser(false);
                setInviteForm({ email: '', name: '', roleDescription: '' }); // Reset form
                setInviteError(''); // Clear any errors
                setInvalidEmail(false); // Reset invalid email state
              }
            }}
            style={{
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              position: "fixed",
              zIndex: 101,
              height: "100vh",
              display: "flex",
              backgroundColor: "rgba(0, 0, 0, 0.5)"
            }}
          >
            <div style={{maxWidth: 500, width: "100%", padding: 32, backgroundColor: "#fff", borderRadius: "8px"}}>
              <p style={{margin: 0, fontWeight: "bold", fontSize: "24px", marginBottom: "16px"}}>Invite to Event</p>
              
              {inviteError && (
                <div style={{
                  color: 'red',
                  marginBottom: '16px',
                  padding: '8px',
                  backgroundColor: '#ffebee',
                  borderRadius: '4px'
                }}>
                  {inviteError}
                </div>
              )}

              <div style={{display: "flex", gap: "16px", marginBottom: "16px"}}>
                <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
                  <label style={{color: "gray", marginBottom: "8px", display: "block"}}>Email</label>
                  <input
                    ref={emailInputRef}
                    name="email"
                    value={inviteForm.email}
                    onChange={handleInviteChange}
                    placeholder="Enter email address"
                    style={{
                      padding: "8px",
                      border: `1px solid ${invalidEmail ? '#ff0000' : '#D0D7DE'}`,
                      borderRadius: "8px",
                      fontWeight: "400",
                      outline: "none",
                      backgroundColor: invalidEmail ? '#fff5f5' : 'white'
                    }}
                  />
                </div>

                
                <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
                  <label style={{color: "gray", marginBottom: "8px", display: "block"}}>Name</label>
                  <input
                    name="name"
                    value={inviteForm.name}
                    onChange={handleInviteChange}
                    placeholder="Enter full name"
                    style={{
                      padding: "8px",
                      border: "1px solid #D0D7DE",
                      borderRadius: "8px",
                      fontWeight: "400"
                    }}
                  />
                </div>
              </div>
              
              <div style={{marginBottom: "16px", display: "flex", flexDirection: "column"}}>
                <label style={{color: "gray", marginBottom: "8px", display: "block"}}>Role (optional)</label>
                <textarea
                  name="roleDescription"
                  value={inviteForm.roleDescription}
                  onChange={handleInviteChange}
                  placeholder="Enter team member's role"
                  style={{
                    padding: "8px",
                    border: "1px solid #D0D7DE",
                    borderRadius: "8px",
                    fontWeight: "400",
                    minHeight: "80px",
                    resize: "vertical"
                  }}
                />
              </div>

              <button 
                onClick={handleInviteSubmit}
                disabled={inviteLoading || !inviteForm.email || !inviteForm.name}
                style={{
                  width: "100%",
                  background: inviteLoading || !inviteForm.email || !inviteForm.name ? '#666' : 'black',
                  color: "white",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: inviteLoading || !inviteForm.email || !inviteForm.name ? 'default' : 'pointer',
                  marginBottom: "16px"
                }}
              >
                {inviteLoading ? "Sending..." : "Send Invitation"}
              </button>

            </div>
          </div>
        )}
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
                        height: 75,
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
                  overflowX: "auto",
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
                        height: 75,
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
                          height: 75,
                          borderRight: "1px solid #EBEBEB",
                          borderBottom: "1px solid #EBEBEB",
                          flexShrink: 0
                        }}></div>
                      ))}
                    </div>
                  ))}

                  {/* Add Team Column */}
                  <div 
                  onClick={() =>
                    {console.log("Invite new member")
                    setIsInvitingNewUser(true)}
                  }
                  
                  style={{display: "flex", cursor: "pointer", flexDirection: "column", flexShrink: 0}}>
                    <p style={{
                      margin: 0, 
                      height: 22, 
                      width: 201,
                      borderRight: "1px solid #EBEBEB",
                      borderBottom: "1px solid #EBEBEB",
                      paddingLeft: 16,
                      paddingTop: 6,
                      paddingBottom: 5,
                      cursor: "pointer",
                      backgroundColor: "#fff",
                      color: "#0969DA"
                    }}>+ Add</p>
                    {Array.from({ length: hoursDiff }).map((_, index) => (
                      <div key={index} style={{
                        width: 217,
                        height: 75,
                        borderRight: "1px solid #EBEBEB",
                        borderBottom: "1px solid #EBEBEB",
                        flexShrink: 0
                      }}></div>
                    ))}
                  </div>
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
