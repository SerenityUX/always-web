import Head from "next/head";
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Navigation from '../components/Navigation';

// Keep these helper functions outside the component
const isTimeOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

const isWithinEventBounds = (startTime, endTime, eventStartTime, eventEndTime) => {
  return startTime >= eventStartTime && endTime <= eventEndTime;
};

export default function Home() {
  const router = useRouter();
  const { tab, eventId } = router.query;
  console.log("TAB IS", tab)

  const currentTab = tab || "Run of Show";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [newEventId, setNewEventId] = useState(null);

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
          const urlParams = new URLSearchParams(window.location.search);
          const tabParam = urlParams.get('tab') ? `&tab=${urlParams.get('tab')}` : '&tab=Run of Show';
          await router.push(`/?eventId=${targetEventId}${tabParam}`);
          setSelectedEventId(targetEventId);
          setSelectedEvent(userData.events[targetEventId]);
          localStorage.setItem('lastVisited', targetEventId);
        } else if (router.query.eventId && eventIds.includes(router.query.eventId)) {
          setSelectedEventId(router.query.eventId);
          setSelectedEvent(userData.events[router.query.eventId]);
          localStorage.setItem('lastVisited', router.query.eventId);
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

  // Update the handleEventTitleUpdate function
  const handleEventTitleUpdate = async (calendarEventId, newTitle) => {
    try {
      console.log('Updating event title:', { calendarEventId, newTitle });
      
      const response = await fetch('https://serenidad.click/hacktime/updateCalendarEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          calendarEventId: calendarEventId,
          title: newTitle
        }),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event title');
      }
      
      // Update the local state with the new title
      setSelectedEvent(prev => ({
        ...prev,
        calendar_events: prev.calendar_events.map(evt => 
          evt.id === calendarEventId ? { ...evt, title: newTitle } : evt
        )
      }));

      console.log('Successfully updated event title');
    } catch (error) {
      console.error('Failed to update event title:', error);
      alert('Failed to update event title: ' + error.message);
    }
  };

  // Move handleDeleteCalendarEvent inside the component
  const handleDeleteCalendarEvent = async (calendarEventId) => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/deleteCalendarEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          calendarEventId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete calendar event');
      }

      // Remove the event from local state
      setSelectedEvent(prev => ({
        ...prev,
        calendar_events: prev.calendar_events.filter(event => event.id !== calendarEventId)
      }));

    } catch (error) {
      console.error('Failed to delete calendar event:', error);
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
                  <div 
                    style={{
                      position: "relative",
                      userSelect: "none"
                    }}
                    onMouseDown={(e) => {
                      const targetElement = e.currentTarget;
                      const rect = targetElement.getBoundingClientRect();
                      const initialY = e.clientY;
                      let dragStarted = false;
                      let dragTimeout;
                      
                      // Store initial mouse position
                      const initialMousePos = {
                        x: e.clientX,
                        y: e.clientY
                      };

                      const handleMouseMove = (moveEvent) => {
                        // Calculate distance moved
                        const distance = Math.sqrt(
                          Math.pow(moveEvent.clientX - initialMousePos.x, 2) + 
                          Math.pow(moveEvent.clientY - initialMousePos.y, 2)
                        );

                        // Only start drag if we've moved at least 5 pixels
                        if (!dragStarted && distance < 5) {
                          return;
                        }
                      };

                      // Start listening for mouse movement immediately
                      document.addEventListener('mousemove', handleMouseMove);

                      // Set timeout for drag initialization
                      dragTimeout = setTimeout(() => {
                        const startY = initialY - rect.top;
                        const hoursFromStart = Math.floor(startY / 76);
                        const startTime = new Date(selectedEvent.startTime);
                        const dragStartTime = new Date(startTime.getTime() + (hoursFromStart * 60 * 60 * 1000));
                        let dragEndTime = dragStartTime;
                        
                        // Create preview element
                        const preview = document.createElement('div');
                        preview.style.position = 'absolute';
                        preview.style.left = '40px';
                        preview.style.width = 'calc(100% - 48px)';
                        preview.style.backgroundColor = 'rgb(2, 147, 212)';
                        preview.style.borderRadius = '8px';
                        preview.style.zIndex = '1';
                        preview.style.opacity = '0.8';
                        targetElement.appendChild(preview);

                        const updatePreview = (start, end) => {
                          const startHours = Math.floor((start - startTime) / (1000 * 60 * 60));
                          const endHours = Math.ceil((end - startTime) / (1000 * 60 * 60));
                          
                          const topPos = startHours * 76;
                          const height = (endHours - startHours) * 76;
                          
                          preview.style.top = `${topPos}px`;
                          preview.style.height = `${height}px`;
                        };

                        updatePreview(dragStartTime, dragEndTime);
                        dragStarted = true;

                        // Replace the initial mousemove handler with the drag handler
                        document.removeEventListener('mousemove', handleMouseMove);
                        
                        const handleDragMove = (moveEvent) => {
                          const endY = moveEvent.clientY - rect.top;
                          const endHoursFromStart = Math.ceil(endY / 76);
                          dragEndTime = new Date(startTime.getTime() + (endHoursFromStart * 60 * 60 * 1000));
                          updatePreview(dragStartTime, dragEndTime);
                        };

                        document.addEventListener('mousemove', handleDragMove);

                        const handleMouseUp = async () => {
                          // Clean up event listeners
                          document.removeEventListener('mousemove', handleDragMove);
                          document.removeEventListener('mouseup', handleMouseUp);

                          // If we haven't actually started dragging, just clean up and return
                          if (!dragStarted) {
                            return;
                          }

                          // Remove preview element
                          if (preview.parentNode) {
                            preview.remove();
                          }

                          const finalStartTime = dragStartTime < dragEndTime ? dragStartTime : dragEndTime;
                          const finalEndTime = dragStartTime < dragEndTime ? dragEndTime : dragStartTime;

                          // Add validation check
                          const mainEventStart = new Date(selectedEvent.startTime);
                          const mainEventEnd = new Date(selectedEvent.endTime);
                          
                          if (!isWithinEventBounds(finalStartTime, finalEndTime, mainEventStart, mainEventEnd)) {
                            preview.remove();
                            console.log('Events must be within the event start and end times');
                            return;
                          }

                          // Check for overlaps with existing events
                          const hasOverlap = selectedEvent?.calendar_events?.some(event => {
                            const existingStart = new Date(event.startTime);
                            const existingEnd = new Date(event.endTime);
                            return isTimeOverlapping(
                              finalStartTime,
                              finalEndTime,
                              existingStart,
                              existingEnd
                            );
                          });

                          if (hasOverlap) {
                            preview.remove();
                            console.log('Cannot create overlapping events');
                            return;
                          }

                          try {
                            const response = await fetch('https://serenidad.click/hacktime/createCalendarEvent', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                token: localStorage.getItem('token'),
                                eventId: selectedEventId,
                                calendarEventId: crypto.randomUUID(),
                                title: '', // Start with empty title
                                startTime: finalStartTime.toISOString(),
                                endTime: finalEndTime.toISOString(),
                                color: '2,147,212'
                              }),
                            });

                            if (!response.ok) {
                              throw new Error('Failed to create calendar event');
                            }

                            const newEvent = await response.json();
                            
                            setNewEventId(newEvent.id);
                            
                            setSelectedEvent(prev => ({
                              ...prev,
                              calendar_events: [...(prev.calendar_events || []), {
                                ...newEvent,
                                startTime: newEvent.start_time,
                                endTime: newEvent.end_time
                              }]
                            }));

                          } catch (error) {
                            console.error('Failed to create calendar event:', error);
                          }
                        };

                        document.addEventListener('mouseup', handleMouseUp);
                      }, 500); // 500ms delay

                      // Handle early mouse up (before drag starts)
                      const handleEarlyMouseUp = () => {
                        clearTimeout(dragTimeout);
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleEarlyMouseUp);
                      };
                      document.addEventListener('mouseup', handleEarlyMouseUp);
                    }}
                  >
                    {/* Map calendar events */}
                    {selectedEvent?.calendar_events
                      ?.filter(event => {
                        const eventStart = new Date(event.startTime);
                        const eventEnd = new Date(event.endTime);
                        const mainEventStart = new Date(selectedEvent.startTime);
                        const mainEventEnd = new Date(selectedEvent.endTime);
                        return isWithinEventBounds(eventStart, eventEnd, mainEventStart, mainEventEnd);
                      })
                      .map((event, index) => {
                        const eventStart = new Date(event.startTime);
                        const eventEnd = new Date(event.endTime);
                        const dayStart = new Date(selectedEvent.startTime);
                        
                        // Format time helper function
                        const formatTime = (date) => {
                          const minutes = date.getUTCMinutes();
                          return date.toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            minute: minutes === 0 ? undefined : '2-digit',
                            hour12: true,
                            timeZone: 'UTC'
                          }).toLowerCase();
                        };
                        
                        const backgroundColor = event.color ? 
                          `rgb(${event.color})` : 
                          "#DA8000";
                        
                        const topOffset = ((eventStart - dayStart) / (1000 * 60 * 60)) * 76;
                        const duration = (eventEnd - eventStart) / (1000 * 60 * 60);
                        const height = (duration * 76) - 48;
                        
                        return (
                          <div key={index} style={{
                            position: "absolute",
                            zIndex: 2,
                            top: topOffset
                          }}>
                            <div style={{marginLeft: 24, marginTop: 0, padding: 8, height: height}}>
                              <div style={{
                                backgroundColor,
                                borderRadius: 8,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                height: "100%",
                                padding: 16,
                                width: "140px",
                                marginLeft: 8,
                                userSelect: "none",
                                cursor: "pointer"
                              }}>
                                <p
                                  ref={el => {
                                    // Auto-focus if this is the newly created event
                                    if (el && event.id === newEventId) {
                                      el.focus();
                                      setNewEventId(null); // Clear the newEventId after focusing
                                    }
                                  }}
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const newTitle = e.target.innerText.trim();
                                    if (newTitle === '' && event.title === '') {
                                      // Delete the event if it was never given a title
                                      handleDeleteCalendarEvent(event.id);
                                    } else if (newTitle !== event.title) {
                                      // Update the title if it changed
                                      handleEventTitleUpdate(event.id, newTitle);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      e.target.blur();
                                    } else if (e.key === 'Escape') {
                                      // If it's a new event with no title, delete it
                                      if (event.title === '' && e.target.innerText.trim() === '') {
                                        handleDeleteCalendarEvent(event.id);
                                      } else {
                                        // Otherwise just blur the input
                                        e.target.blur();
                                      }
                                    }
                                  }}
                                  style={{
                                    margin: 0,
                                    fontSize: 16,
                                    color: "#fff",
                                    outline: 'none',
                                    cursor: "text",
                                    padding: "2px 4px",
                                    borderRadius: "4px",
                                    transition: "background-color 0.2s",
                                    wordWrap: "break-word",
                                    overflowWrap: "break-word",
                                    whiteSpace: "pre-wrap",
                                    minHeight: "24px",
                                    "&:hover": {
                                      backgroundColor: "rgba(255, 255, 255, 0.1)"
                                    }
                                  }}
                                >
                                  {event.title}
                                </p>
                                <p style={{margin: 0, fontSize: 14, color: "#fff", opacity: 0.8}}>
                                  {formatTime(eventStart)} - {formatTime(eventEnd)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    {Array.from({ length: hoursDiff }).map((_, index) => {
                      const cellTime = new Date(startDate.getTime() + (index * 60 * 60 * 1000));
                      const isFirstCell = index === 0;
                      const previousCellTime = index > 0 
                        ? new Date(startDate.getTime() + ((index - 1) * 60 * 60 * 1000))
                        : null;
                      const dayChanged = previousCellTime && 
                        cellTime.getUTCDate() !== previousCellTime.getUTCDate();

                      // Only show day label if it's first cell or day changed
                      const showDayLabel = isFirstCell || dayChanged;
                      const dayLabel = cellTime.toLocaleString('en-US', { 
                        weekday: 'short', 
                        timeZone: 'UTC'
                      }).toUpperCase();

                      return (
                        <div key={index} style={{
                          width: 217,
                          position: "relative",
                          height: 75,
                          borderRight: "1px solid #EBEBEB",
                          borderBottom: "1px solid #EBEBEB",
                          flexShrink: 0
                        }}>
                          <p style={{
                            position: "absolute",
                            fontSize: 9,
                            paddingLeft: 2,
                            width: 28, 
                            marginTop: -6,
                            backgroundColor: "#fff",
                            userSelect: "none"
                          }}>
                            {showDayLabel && (
                              <span style={{ display: 'block' }}>{dayLabel}</span>
                            )}
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

        {currentTab == "Schedule" && 
          <div style={{
            flex: 1,
            display: "flex",
            fontSize: "24px",
            width: "100%",
            justifyContent: "center"
          }}>
            <div style={{
              width: 800, 
              marginTop: 24
            }}>
              <p style={{margin: 0}}>Event Schedule</p>
              
              <div 
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginTop: 24,
                  borderTop: "1px solid #EBEBEB",
                  position: "relative"
                }}
                onMouseDown={(e) => {
                  const targetElement = e.currentTarget;
                  const rect = targetElement.getBoundingClientRect();
                  const initialY = e.clientY;
                  let dragStarted = false;
                  let dragTimeout;
                  
                  // Store initial mouse position
                  const initialMousePos = {
                    x: e.clientX,
                    y: e.clientY
                  };

                  const handleMouseMove = (moveEvent) => {
                    // Calculate distance moved
                    const distance = Math.sqrt(
                      Math.pow(moveEvent.clientX - initialMousePos.x, 2) + 
                      Math.pow(moveEvent.clientY - initialMousePos.y, 2)
                    );

                    // Only start drag if we've moved at least 5 pixels
                    if (!dragStarted && distance < 5) {
                      return;
                    }
                  };

                  // Start listening for mouse movement immediately
                  document.addEventListener('mousemove', handleMouseMove);

                  // Set timeout for drag initialization
                  dragTimeout = setTimeout(() => {
                    const startY = initialY - rect.top;
                    const hoursFromStart = Math.floor(startY / 76);
                    const startTime = new Date(selectedEvent.startTime);
                    const dragStartTime = new Date(startTime.getTime() + (hoursFromStart * 60 * 60 * 1000));
                    let dragEndTime = dragStartTime;
                    
                    // Create preview element
                    const preview = document.createElement('div');
                    preview.style.position = 'absolute';
                    preview.style.left = '40px';
                    preview.style.width = '752px';
                    preview.style.right = '24px';
                    preview.style.backgroundColor = 'rgb(2, 147, 212)';
                    preview.style.borderRadius = '8px';
                    preview.style.zIndex = '1';
                    preview.style.opacity = '0.8';
                    targetElement.appendChild(preview);

                    const updatePreview = (start, end) => {
                      const startHours = Math.floor((start - startTime) / (1000 * 60 * 60));
                      const endHours = Math.ceil((end - startTime) / (1000 * 60 * 60));
                      
                      const topPos = startHours * 76;
                      const height = (endHours - startHours) * 76;
                      
                      preview.style.top = `${topPos}px`;
                      preview.style.height = `${height}px`;
                    };

                    updatePreview(dragStartTime, dragEndTime);
                    dragStarted = true;

                    // Replace the initial mousemove handler with the drag handler
                    document.removeEventListener('mousemove', handleMouseMove);
                    
                    const handleDragMove = (moveEvent) => {
                      const endY = moveEvent.clientY - rect.top;
                      const endHoursFromStart = Math.ceil(endY / 76);
                      dragEndTime = new Date(startTime.getTime() + (endHoursFromStart * 60 * 60 * 1000));
                      updatePreview(dragStartTime, dragEndTime);
                    };

                    document.addEventListener('mousemove', handleDragMove);

                    const handleMouseUp = async () => {
                      // Clean up event listeners
                      document.removeEventListener('mousemove', handleDragMove);
                      document.removeEventListener('mouseup', handleMouseUp);

                      // If we haven't actually started dragging, just clean up and return
                      if (!dragStarted) {
                        return;
                      }

                      // Remove preview element
                      if (preview.parentNode) {
                        preview.remove();
                      }

                      const finalStartTime = dragStartTime < dragEndTime ? dragStartTime : dragEndTime;
                      const finalEndTime = dragStartTime < dragEndTime ? dragEndTime : dragStartTime;

                      // Add validation check
                      const mainEventStart = new Date(selectedEvent.startTime);
                      const mainEventEnd = new Date(selectedEvent.endTime);
                      
                      if (!isWithinEventBounds(finalStartTime, finalEndTime, mainEventStart, mainEventEnd)) {
                        preview.remove();
                        console.log('Events must be within the event start and end times');
                        return;
                      }

                      // Check for overlaps with existing events
                      const hasOverlap = selectedEvent?.calendar_events?.some(event => {
                        const existingStart = new Date(event.startTime);
                        const existingEnd = new Date(event.endTime);
                        return isTimeOverlapping(
                          finalStartTime,
                          finalEndTime,
                          existingStart,
                          existingEnd
                        );
                      });

                      if (hasOverlap) {
                        preview.remove();
                        console.log('Cannot create overlapping events');
                        return;
                      }

                      try {
                        const response = await fetch('https://serenidad.click/hacktime/createCalendarEvent', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            token: localStorage.getItem('token'),
                            eventId: selectedEventId,
                            calendarEventId: crypto.randomUUID(),
                            title: '', // Start with empty title
                            startTime: finalStartTime.toISOString(),
                            endTime: finalEndTime.toISOString(),
                            color: '2,147,212'
                          }),
                        });

                        if (!response.ok) {
                          throw new Error('Failed to create calendar event');
                        }

                        const newEvent = await response.json();
                        
                        setNewEventId(newEvent.id);
                        
                        setSelectedEvent(prev => ({
                          ...prev,
                          calendar_events: [...(prev.calendar_events || []), {
                            ...newEvent,
                            startTime: newEvent.start_time,
                            endTime: newEvent.end_time
                          }]
                        }));

                      } catch (error) {
                        console.error('Failed to create calendar event:', error);
                      }
                    };

                    document.addEventListener('mouseup', handleMouseUp);
                  }, 500); // 500ms delay

                  // Handle early mouse up (before drag starts)
                  const handleEarlyMouseUp = () => {
                    clearTimeout(dragTimeout);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleEarlyMouseUp);
                  };
                  document.addEventListener('mouseup', handleEarlyMouseUp);
                }}
              >
                {/* Calendar Events Layer */}
                {selectedEvent?.calendar_events
                  ?.filter(event => {
                    const eventStart = new Date(event.startTime);
                    const eventEnd = new Date(event.endTime);
                    const mainEventStart = new Date(selectedEvent.startTime);
                    const mainEventEnd = new Date(selectedEvent.endTime);
                    return isWithinEventBounds(eventStart, eventEnd, mainEventStart, mainEventEnd);
                  })
                  .map((event, index) => {
                    const eventStart = new Date(event.startTime);
                    const eventEnd = new Date(event.endTime);
                    const dayStart = new Date(selectedEvent.startTime);
                    
                    // Format time helper function
                    const formatTime = (date) => {
                      const minutes = date.getUTCMinutes();
                      return date.toLocaleTimeString('en-US', { 
                        hour: 'numeric',
                        minute: minutes === 0 ? undefined : '2-digit',
                        hour12: true,
                        timeZone: 'UTC'
                      }).toLowerCase();
                    };
                    
                    const backgroundColor = event.color ? 
                      `rgb(${event.color})` : 
                      "#DA8000";
                    
                    const topOffset = ((eventStart - dayStart) / (1000 * 60 * 60)) * 76;
                    const duration = (eventEnd - eventStart) / (1000 * 60 * 60);
                    const height = (duration * 76) - 48;
                    
                    return (
                      <div key={index} style={{
                        position: "absolute",
                        zIndex: 2,
                        top: topOffset,
                        width: "100%"
                      }}>
                        <div style={{margin: "0 24px", padding: 8, height: height}}>
                          <div style={{
                            backgroundColor,
                            borderRadius: 8,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: "100%",
                            padding: 16,
                            width: "calc(100% - 16px)",
                            marginLeft: 8,
                            userSelect: "none",
                            cursor: "pointer"
                          }}>
                            <p
                              ref={el => {
                                // Auto-focus if this is the newly created event
                                if (el && event.id === newEventId) {
                                  el.focus();
                                  setNewEventId(null); // Clear the newEventId after focusing
                                }
                              }}
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const newTitle = e.target.innerText.trim();
                                if (newTitle === '' && event.title === '') {
                                  // Delete the event if it was never given a title
                                  handleDeleteCalendarEvent(event.id);
                                } else if (newTitle !== event.title) {
                                  // Update the title if it changed
                                  handleEventTitleUpdate(event.id, newTitle);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.target.blur();
                                } else if (e.key === 'Escape') {
                                  // If it's a new event with no title, delete it
                                  if (event.title === '' && e.target.innerText.trim() === '') {
                                    handleDeleteCalendarEvent(event.id);
                                  } else {
                                    // Otherwise just blur the input
                                    e.target.blur();
                                  }
                                }
                              }}
                              style={{
                                margin: 0,
                                fontSize: 16,
                                color: "#fff",
                                outline: 'none',
                                cursor: "text",
                                padding: "2px 4px",
                                borderRadius: "4px",
                                transition: "background-color 0.2s",
                                wordWrap: "break-word",
                                overflowWrap: "break-word",
                                whiteSpace: "pre-wrap",
                                minHeight: "24px",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 255, 255, 0.1)"
                                }
                              }}
                            >
                              {event.title}
                            </p>
                            <p style={{margin: 0, fontSize: 14, color: "#fff", opacity: 0.8}}>
                              {formatTime(eventStart)} - {formatTime(eventEnd)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Time Grid */}
                {(() => {
                  // Safety check for selectedEvent and valid dates
                  if (!selectedEvent?.startTime || !selectedEvent?.endTime) {
                    return null;
                  }

                  const startDate = new Date(selectedEvent.startTime);
                  const endDate = new Date(selectedEvent.endTime);
                  const hoursDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60));

                  if (!hoursDiff || hoursDiff < 0 || !Number.isFinite(hoursDiff)) {
                    return null;
                  }

                  return Array.from({ length: hoursDiff }).map((_, index) => {
                    const cellTime = new Date(startDate.getTime() + (index * 60 * 60 * 1000));
                    const isFirstCell = index === 0;
                    const previousCellTime = index > 0 
                      ? new Date(startDate.getTime() + ((index - 1) * 60 * 60 * 1000))
                      : null;
                    const dayChanged = previousCellTime && 
                      cellTime.getUTCDate() !== previousCellTime.getUTCDate();

                    const showDayLabel = isFirstCell || dayChanged;
                    const dayLabel = cellTime.toLocaleString('en-US', { 
                      weekday: 'short', 
                      timeZone: 'UTC'
                    }).toUpperCase();

                    return (
                      <div key={index} style={{
                        width: "100%",
                        position: "relative",
                        height: 75,
                        borderBottom: "1px solid #EBEBEB",
                        flexShrink: 0
                      }}>
                        <p style={{
                          position: "absolute",
                          fontSize: 9,
                          paddingLeft: 2,
                          width: 28,
                          marginTop: -6,
                          backgroundColor: "#fff",
                          userSelect: "none",
                          color: "#A2A2A2"
                        }}>
                          {showDayLabel && (
                            <span style={{ display: 'block' }}>{dayLabel}</span>
                          )}
                          {cellTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            timeZone: 'UTC',
                            hour12: true 
                          })}
                        </p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        }
        {(currentTab != "Run of Show" && currentTab != "Schedule")&& 

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
