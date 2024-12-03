import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import ProfileImage from './ProfileImage';
import ProfilePictureUpload from './ProfilePictureUpload';
import Head from 'next/head';

// Add this constant at the top of the file, after the imports
const commonTimezones = {
  "America/Los_Angeles": "Pacific Time (PT)",
  "America/Denver": "Mountain Time (MT)",
  "America/Chicago": "Central Time (CT)",
  "America/New_York": "Eastern Time (ET)",
  "GMT": "Greenwich Mean Time (GMT)",
  "UTC": "Coordinated Universal Time (UTC)"
};

// Add these constants at the top of the file after the imports
const GOOGLE_CLIENT_ID = '691094339111-3blkd3665p0t9qgvig469bjpiasiq0ob.apps.googleusercontent.com';
const REDIRECT_URI = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/auth/google/callback'
  : 'https://always.sh/auth/google/callback'; // No @ symbol needed
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

// Move this to the top of the Navigation component, after the state declarations
const navItems = [
  { name: "Run of Show", icon: "/runOfShow.svg" },
  { name: "Schedule", icon: "/Schedule.svg" },
  { name: "Announcements", icon: "/Announcements.svg" },
  { name: "Venue", icon: "/venue.svg" },
  { name: "Team", icon: "/Team.svg" }
];

// Update the COLORS array to exclude grey
const COLORS = [
  "2,147,212",  // blue
  "218,128,0",  // orange
  "8,164,42",   // green
  "142,8,164",  // purple
  "190,58,44"   // red
];

// Update the getRandomColor function to return a new color each time
const getRandomColor = () => {
  const index = Math.floor(Math.random() * COLORS.length);
  return COLORS[index];
};

// Update the getKeyStyle function
const getKeyStyle = (isPressed, keyColor) => ({
  padding: '1px 2px',
  borderRadius: '2px',
  backgroundColor: isPressed ? `rgba(${keyColor}, 0.95)` : 'rgba(255, 255, 255, 0.95)',
  color: isPressed ? '#fff' : '#000',
  fontSize: '7px',
  minWidth: '10px',
  textAlign: 'center',
  border: `1px solid ${isPressed ? `rgba(${keyColor}, 0.3)` : 'rgba(255, 255, 255, 0.2)'}`,
  boxShadow: isPressed ? 
    'inset 0 1px 2px rgba(0, 0, 0, 0.2)' :
    `
      0 0.5px 0 0.3px rgba(0, 0, 0, 0.2),
      0 1.5px 1px rgba(0, 0, 0, 0.25),
      inset 0 0.5px 0 rgba(255, 255, 255, 1)
    `,
  textShadow: isPressed ? 'none' : '0 1px 0 rgba(255, 255, 255, 0.4)',
  fontWeight: '600',
  background: isPressed ? 
    `linear-gradient(to bottom, rgba(${keyColor}, 0.9) 0%, rgba(${keyColor}, 1) 100%)` :
    'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.85) 100%)',
  transition: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isPressed ? 'translateY(0.5px)' : 'none'
});

// Add this helper function at the top
const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export default function Navigation({ 
  user, 
  onUserUpdate, 
  selectedEventId, 
  showCreateEventModal, 
  setShowCreateEventModal, 
  showEventDropdown, 
  setShowEventDropdown, 
  lowerNav,
  onEventSelect,
  showEditEventModal,
  setShowEditEventModal,
  editEventForm,
  setEditEventForm,
  handleEditEvent,
  editEventLoading,
  editEventError
}) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  const { tab, event } = router.query;
  // const [showEventDropdown, setShowEventDropdown] = useState(false);
  const eventDropdownRef = useRef(null);
  // const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState(null);
  const [pressedKeys, setPressedKeys] = useState({
    cmd: false,
    shift: false,
    arrow: false
  });

  // Transform events object into array and sort by title
  const eventsList = user?.events ? 
    Object.values(user.events)
      .sort((a, b) => a.title.localeCompare(b.title))
    : [];

  // Find current event from URL parameter
  const currentEvent = user?.events && selectedEventId ? user.events[selectedEventId] : null;

  // Use currentEvent from URL, or lastVisited, or first event as fallback
  const defaultEvent = currentEvent || 
    (localStorage.getItem('lastVisited') ? 
      eventsList.find(e => e.id.toString() === localStorage.getItem('lastVisited')) 
      : null) || 
    eventsList[0];

  const [selectedEvent, setSelectedEvent] = useState(defaultEvent);

  // Update selected event when URL or user data changes
  useEffect(() => {
    console.log('Navigation useEffect triggered with:', {
      currentEvent,
      defaultEvent,
      selectedEventId
    });
    
    // Only update selected event if there's no explicit selection
    if (currentEvent) {
      setSelectedEvent(currentEvent);
    } else if (!selectedEventId && defaultEvent) {
      // Only use default if there's no explicit selection
      setSelectedEvent(defaultEvent);
    }
  }, [user, event, currentEvent, defaultEvent, selectedEventId]); // Added selectedEventId to dependencies

  const selectedTab = tab || "Run of Show";

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
        setShowEventDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTabClick = (item) => {
    console.log('Tab clicked:', {
      item,
      selectedEventId
    });

    if (selectedEventId) {
      router.push(`/event?eventId=${selectedEventId}&tab=${encodeURIComponent(item)}`, undefined, { shallow: true });
    }
  };

  const handleEventSelect = (eventObj) => {
    console.log('Event selected:', {
      newId: eventObj.id,
      currentId: selectedEventId,
      tab
    });

    onEventSelect(eventObj.id);
    setShowEventDropdown(false);
    localStorage.setItem('lastVisited', eventObj.id);
    
    if (selectedEventId !== eventObj.id) {
      console.log('Updating URL for new event');
      router.push(`/event?eventId=${eventObj.id}${tab ? `&tab=${tab}` : ''}`, undefined, { shallow: true });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleProfilePictureUpdate = (newProfilePictureUrl) => {
    if (user) {
      const updatedUser = {
        ...user,
        profile_picture_url: newProfilePictureUrl
      };
      onUserUpdate(updatedUser);
    }
  };

  const CreateEventModal = ({ setShowCreateEventModal }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: new Date().toISOString().split('T')[0],
      endTime: '17:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      try {
        const startTime = `${form.startDate} ${form.startTime}:00`;
        const endTime = `${form.endDate} ${form.endTime}:00`;

        if (new Date(endTime) <= new Date(startTime)) {
          throw new Error('End time must be after start time');
        }

        const response = await fetch('https://serenidad.click/hacktime/createEvent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: localStorage.getItem('token'),
            title: form.title,
            startTime,
            endTime,
            timezone: form.timezone
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create event');
        }

        localStorage.setItem('lastVisited', data.id);
        window.location.href = `/event?eventId=${data.id}&tab=Run of Show`;

      } catch (error) {
        setError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowCreateEventModal(false);
          }
        }}
        style={{
          position: "fixed",

          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 131023012031092301,
          marginTop: -97,
          backgroundColor: "rgba(0, 0, 0, 0.5)"
        }}
      >
        <div style={{
          flex: "0 1 500px",
          padding: 32,
          backgroundColor: "#fff",
          borderRadius: "8px",
          margin: "0 16px"
        }}>
          <p style={{margin: 0, fontWeight: "bold", fontSize: "24px", marginBottom: "16px"}}>Create Event</p>
          
          {error && (
            <div style={{
              color: 'red',
              marginBottom: '16px',
              padding: '8px',
              backgroundColor: '#ffebee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: '1'
            }}>
              <label style={{
                marginBottom: '8px', 
                fontSize: '14px'
              }}>
                Event Name
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({...prev, title: e.target.value}))}
                required
                style={{
                  flex: '1',
                  padding: '8px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  border: '1px solid #EBEBEB'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: '1'
            }}>
              <label style={{
                marginBottom: '8px', 
                fontSize: '14px'
              }}>
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => setForm(prev => ({...prev, timezone: e.target.value}))}
                required
                style={{
                  flex: '1',
                  padding: '8px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  border: '1px solid #EBEBEB',
                  backgroundColor: '#fff'
                }}
              >
                <optgroup label="Common Timezones">
                  {Object.entries(commonTimezones).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Timezones">
                  {Intl.supportedValuesOf('timeZone').map(tz => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Start Date/Time Group */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                {/* Start Date */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  <label style={{
                    marginBottom: '8px', 
                    fontSize: '14px'
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm(prev => ({...prev, startDate: e.target.value}))}
                    required
                    style={{
                      flex: '1',
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>

                {/* Start Time */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  <label style={{
                    marginBottom: '8px', 
                    fontSize: '14px'
                  }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm(prev => ({...prev, startTime: e.target.value}))}
                    required
                    style={{
                      flex: '1',
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>
              </div>

              {/* End Date/Time Group */}
              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                {/* End Date */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  <label style={{
                    marginBottom: '8px', 
                    fontSize: '14px'
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm(prev => ({...prev, endDate: e.target.value}))}
                    required
                    style={{
                      flex: '1',
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>

                {/* End Time */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  <label style={{
                    marginBottom: '8px', 
                    fontSize: '14px'
                  }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm(prev => ({...prev, endTime: e.target.value}))}
                    required
                    style={{
                      flex: '1',
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: '8px'
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log('Navigation received selectedEventId:', selectedEventId);
  }, [selectedEventId]);

  // Add this function inside Navigation component
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('https://serenidad.click/hacktime/deleteEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          eventId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Update local state by removing the event
      onUserUpdate(prev => {
        const { [eventId]: deletedEvent, ...remainingEvents } = prev.events;
        return {
          ...prev,
          events: remainingEvents
        };
      });

      // If this was the selected event, select another one or clear selection
      if (selectedEventId === eventId) {
        const remainingEventIds = Object.keys(user.events).filter(id => id !== eventId);
        if (remainingEventIds.length > 0) {
          onEventSelect(remainingEventIds[0]);
          router.push(`/event?eventId=${remainingEventIds[0]}&tab=Run of Show`);
        } else {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  // Add this useEffect near the top of the Navigation component
  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data.type === 'GOOGLE_CALENDAR_CONNECTED') {
        // Refresh user data
        const response = await fetch('https://serenidad.click/hacktime/auth', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const userData = await response.json();

          if (userData.organizationEvents) {
            userData.events = userData.organizationEvents;
          }

          onUserUpdate(userData);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUserUpdate]);

  useEffect(() => {
    if (showEditEventModal && selectedEventToEdit) {
      const startDate = new Date(selectedEventToEdit.startTime);
      const endDate = new Date(selectedEventToEdit.endTime);
      
      setEditEventForm({
        title: selectedEventToEdit.title || '',
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0,5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0,5),
        timezone: selectedEventToEdit.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [showEditEventModal, selectedEventToEdit, setEditEventForm]);

  // Update the continuous check useEffect
  useEffect(() => {
    const checkArrowState = () => {
      setPressedKeys(prev => {
        // Only reset if neither meta nor shift are pressed
        if (prev.arrow && !(prev.cmd && prev.shift)) {
          return { ...prev, arrow: false };
        }
        return prev;
      });
    };

    // Increase interval slightly to prevent flickering
    const interval = setInterval(checkArrowState, 200);

    return () => clearInterval(interval);
  }, []);

  // Update the key handling useEffect to ignore events when typing in an input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const isCmd = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isArrowLeft = e.key === 'ArrowLeft';
      const isArrowRight = e.key === 'ArrowRight';

      if (isCmd && isShift && (isArrowLeft || isArrowRight)) {
        e.preventDefault();
        
        const currentTabIndex = navItems.findIndex(i => i.name === selectedTab);
        
        if (isArrowLeft && currentTabIndex > 0) {
          handleTabClick(navItems[currentTabIndex - 1].name);
        } else if (isArrowRight && currentTabIndex < navItems.length - 1) {
          handleTabClick(navItems[currentTabIndex + 1].name);
        }
      }

      setPressedKeys(prev => ({
        ...prev,
        cmd: isCmd,
        shift: isShift,
        arrow: isArrowLeft ? 'left' : isArrowRight ? 'right' : prev.arrow
      }));
    };

    const handleKeyUp = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      setPressedKeys(prev => ({
        ...prev,
        cmd: e.metaKey || e.ctrlKey,
        shift: e.shiftKey,
        arrow: (e.key === 'ArrowLeft' && prev.arrow === 'left') || 
               (e.key === 'ArrowRight' && prev.arrow === 'right') ? 
               false : prev.arrow
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedTab, navItems, handleTabClick]);

  // Add this at the top of the component with other refs
  const navItemRefs = useRef({});

  return (
    <>
      <style jsx global>{`
        .nav-tooltip {
          position: fixed;
          background: linear-gradient(
            180deg, 
            rgba(40, 40, 40, 0.95) 0%,
            rgba(32, 32, 32, 0.95) 100%
          );
          backdrop-filter: blur(8px);
          color: #fff;
          padding: 2px 2px;
          border-radius: 4px;
          font-size: 7px;
          pointer-events: none;
          white-space: nowrap;
          opacity: 0;
          transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
          bottom: -18px;
          transform: translateX(-50%) translateY(-4px);
          left: 50%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 2px 6px rgba(0, 0, 0, 0.15),
            inset 0 0.5px 0 0 rgba(255, 255, 255, 0.08),
            inset 0 -0.5px 0 0 rgba(0, 0, 0, 0.25);
          z-index: 9439249239935933232323232312312312312312325929592592;
          height: fit-content;
          width: fit-content;
        }

        .nav-tooltip::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.06) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          border-radius: 4px;
          pointer-events: none;
        }

        .nav-item-container {
          position: relative;
          z-index: 9439249239935925929592592;
        }

        .nav-item-container:hover .nav-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          transition: all 0.2s cubic-bezier(0.0, 0.0, 0.2, 1);
        }

        .nav-item-container:not(:hover) .nav-tooltip {
          opacity: 0;
          transform: translateX(-50%) translateY(-4px);
          transition: all 0.1s cubic-bezier(0.4, 0.0, 1, 1);
        }
      `}</style>
      
      <div style={{
        backgroundColor: "#F6F8FA", 
        overflow: "visible", 
        borderBottom: '1px solid #EBEBEB',
        position: "relative",
        zIndex: lowerNav ? 1 : 29999
      }}>
        <div style={{
          display: "flex",
          marginBottom: Object.keys(user.events).length == 0 ? 16 : 0,
          alignItems: "center", 
          justifyContent: "space-between", 
          paddingLeft: 32, 
          paddingTop: 16, 
          paddingRight: 32,
          position: "relative",
          zIndex: 9439249239935925929592593
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            position: "relative",
            zIndex: 9439249239935925929592594
          }}>
            <h1 style={{margin: 0, fontSize: 24, height: 24, fontWeight: 600, opacity: 0.9}}>Always</h1>
            {Object.keys(user.events).length != 0 &&
            <div ref={eventDropdownRef} style={{ position: "relative" }}>
              <div 
                onClick={() => setShowEventDropdown(!showEventDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexDirection: "row",
                  gap: 4,
                  paddingTop: 2,
                  paddingBottom: 2,
                  paddingLeft: 6,
                  paddingRight: 6,
                  borderRadius: 4,
                  border: "1px solid #EBEBEB",
                  cursor: "pointer",
                  width: 200
                }}
              >
                <p style={{
                  margin: 0, 
                  fontSize: 16, 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap"
                }}>
                  {currentEvent?.title || 'Select Event'}
                </p>
                <img 
                  style={{
                    height: 16,
                    width: 16,
                    flexShrink: 0
                  }} 
                  src="./icons/unfold.svg"
                />
              </div>
              {showEventDropdown && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 4,
                  backgroundColor: "#fff",
                  border: "1px solid #EBEBEB",
                  borderRadius: 8,
                  width: 200,
                  zIndex: 1000,
                  maxHeight: 400, overflowY: "scroll",
                  padding: 8
                }}>
                  {eventsList.map((eventObj, index, array) => (
                    <div
                      key={eventObj.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px",
                        cursor: "pointer",
                        backgroundColor: selectedEventId === eventObj.id ? "#F6F8FA" : "transparent",
                        borderRadius: "4px",
                        gap: "8px",
                        position: "relative",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F6F8FA";
                        e.currentTarget.querySelector('.action-icons').style.opacity = "0.6";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedEventId !== eventObj.id) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                        e.currentTarget.querySelector('.action-icons').style.opacity = "0";
                      }}
                    >
                      <div 
                        onClick={() => handleEventSelect(eventObj)}
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {eventObj.title}
                      </div>
                      <div 
                        className="action-icons"
                        style={{
                          display: "flex",
                          gap: "4px",
                          opacity: "0",
                          alignItems: "center",
                          transition: "opacity 0.2s"
                        }}
                      >
                        <img 
                          src="/icons/settings.svg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEditEventModal(true);
                            setShowEventDropdown(false);
                            setSelectedEventToEdit(eventObj);
                          }}
                          style={{
                            width: "18x",
                            height: "18px",
                            cursor: "pointer"
                          }}
                          alt="Edit event"
                        />
                        <img 
                          src="/icons/trash.svg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(eventObj.id);
                          }}
                          style={{
                            width: "24px",
                            height: "24px",
                            cursor: "pointer"
                          }}
                          alt="Delete event"
                        />
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      setShowCreateEventModal(true);
                      setShowEventDropdown(false);
                    }}
                    className="nav-item create-event-button"
                    style={{
                      padding: "6px 2px",
                      cursor: "pointer",
                      color: "#0969DA",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: "8px"
                    }}
                  >
                                    <img 
                    style={{
                      height: 16,
                      width: 16,
                      flexShrink: 0,
                      marginLeft: 4
                    }} 
                    src="./icons/plus-blue.svg"
                  />
                  <p style={{
                    margin: 0, 
                    fontSize: 16,
                    fontWeight: 500
                  }}>
                    Create Event
                  </p>
                </div>
                </div>
              )}
            </div>
            }
          </div>
          <div onClick={() => console.log(Object.keys(user.events).length === 0 ? "user.events is empty" : "user.events is not empty")} ref={profileRef} style={{height: 32, overflow: "visible", width: 32, position: "relative"}}>
            <div onClick={() => setShowProfile(!showProfile)} style={{cursor: "pointer"}}>
              <div style={{position: "relative"}}>
              <ProfileImage
                imageUrl={user?.profile_picture_url}
                name={user?.name}
                size={32}
              />
              {user.profile_picture_url == null && 
              <div style={{position: "absolute", top: 0, right: 0, height: 10, width: 10, backgroundColor: "#BE3A2C", borderRadius: "100%"}}>
              </div>
              }
              </div>
            </div>
            {showProfile && (
              <div style={{position: "fixed", zIndex: 100, display: "flex", gap: 8, flexDirection: "column", border: "1px solid #EBEBEB", width: 196, padding: 12, backgroundColor: "#fff", borderRadius: 16, top: 56, right: 32}}>
                <div style={{display: "flex", border: "1px solid #EBEBEB", alignItems: "center", backgroundColor: "#F6F8FA", padding: 16, paddingTop: 8, gap: 14, borderRadius: 8, justifyContent: "center", flexDirection: "column"}}>
                  <div style={{height: 8, position: "relative", width: 8, border: "1px solid #EBEBEB", backgroundColor: "#fff", borderRadius: "100%"}}></div>
                  {user.organization != null  &&
                  <div style={{position: "absolute", backgroundColor: "#5F6368", top: 16, color: "#fff", borderRadius: "8px 8px 0px 0px", display: "flex", alignItems: "center", justifyContent: "center", left: 16, paddingTop: 4, paddingBottom: 4,width: "calc(100% - 32px)"}}>
                    <p style={{margin: 0, fontSize: 14, fontWeight: 600}}>{user?.organization?.organizationName} {user?.organization?.organizationRole}</p>
                  </div>
                  }
                  <div style={{position: "relative", height: 96, width: 96}}>
                    <ProfileImage
                      imageUrl={user?.profile_picture_url}
                      name={user?.name}
                      size={96}
                    />
                    <ProfilePictureUpload onUpload={handleProfilePictureUpdate}>
                      <div style={{position: "relative"}}>
                        
                      <img 
                        style={{
                          height: 16,
                          width: 16,
                          padding: 6,
                          cursor: "pointer",
                          backgroundColor: "#fff",
                          borderRadius: "100%",
                          border: user.profile_picture_url != null ? ("1px solid #EBEBEB") : ("1px solid #BE3A2C"),
                          position: "absolute",
                          right: 0,
                          bottom: 0,
                          animation: user.profile_picture_url == null ? "pulse 1s infinite" : "none"
                        }}
                        src="./icons/edit.svg"
                        alt="Edit profile picture"
                      />
                      </div>
                    </ProfilePictureUpload>
                  </div>
                  <p style={{margin: 0}}>{user?.name}</p>
                  {user.profile_picture_url == null &&
                  
                  <div style={{height: 12, display: "flex", alignItems: "center", flexDirection: "row", gap: 4}}>
                    <div style={{height: 6, width: 6, borderRadius: "100%", backgroundColor: "#BE3A2C"}}></div>
                  <p style={{margin: 0, fontSize: 12, color: "#BE3A2C"}}>Missing Profile Picture</p>
                  </div>
                  }
                </div>
                {/* <div 
                  style={{
                    border: "1px solid #EBEBEB", 
                    paddingTop: 6, 
                    paddingBottom: 6, 
                    display: "flex", 
                    alignItems: "start", 
                    flexDirection: "column", 
                    justifyContent: "start", 
                    gap: 2, 
                    paddingLeft: 12, 
                    paddingRight: 12, 
                    paddingTop: 12, 
                    paddingBottom: 12, 
                    borderRadius: 8
                  }}
                >
                  <p style={{margin: 0, fontSize: 12, fontWeight: 600}}>Google Calendar</p>
                  <p style={{margin: 0, fontSize: 12}}>
                    Keep your calendar up to date with your Run of Show automatically
                  </p>
                  
                  {user?.is_google_calendar_connected ? (
                    <div
                      style={{
                        color: "#1a7f37",
                        backgroundColor: "#dafbe1",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingTop: 8,
                        paddingBottom: 8,
                        marginTop: 8,
                        display: "flex",
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid #1a7f37"
                      }}
                    >
                      <p style={{fontSize: 12, margin: 0, userSelect: "none"}}>Connected</p>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;
                        
                        const width = 500;
                        const height = 600;
                        const left = window.screenX + (window.outerWidth - width) / 2;
                        const top = window.screenY + (window.outerHeight - height) / 2;
                        window.open(
                          googleAuthUrl,
                          'Connect Google Calendar',
                          `width=${width},height=${height},left=${left},top=${top}`
                        );
                      }}
                      style={{
                        color: "#fff",
                        cursor: "pointer",
                        backgroundColor: "#0293D4",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingTop: 8,
                        paddingBottom: 8,
                        marginTop: 8,
                        display: "flex",
                        width: "100%",
                        borderRadius: 8
                      }}
                    >
                      <p style={{fontSize: 12, margin: 0, userSelect: "none"}}>Connect Calendar</p>
                    </div>
                  )}
                </div> */}

                <div 
                  onClick={handleLogout}
                  style={{border: "1px solid #EBEBEB", cursor: "pointer", paddingTop: 6, paddingBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8}}
                >
                  <p style={{margin: 0}}>Logout</p>
                </div>
              </div>
            )}
          </div>
        </div>
        { selectedEvent != null &&
        <div style={{
          display: "flex",
          gap: 24,
          paddingLeft: 32,
          paddingTop: 12,
          paddingRight: 32,
          position: "relative",
          zIndex: 9439249239935925929592594
        }}>
          {navItems.map((item, index) => (
            <div 
              key={item.name}
              ref={el => navItemRefs.current[item.name] = el}
              className="nav-item-container"
              style={{
                paddingBottom: 8,
                
                borderBottom: selectedTab === item.name ? "2px solid #59636E" : "none",
                position: "relative",
                zIndex: 2
              }}
              onClick={() => handleTabClick(item.name)}
            >
              <div 
                className="nav-item" 
                style={{
                  margin: 0, 
                  padding: "4px 6px",
                  borderRadius: 6,
                  color: selectedTab === item.name ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)", 
                  fontSize: 16, 
                  fontWeight: selectedTab === item.name ? 600 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <img 
                  src={item.icon}
                  alt={`${item.name} icon`}
                  style={{
                    width: "14px",
                    height: "14px",
                    opacity: selectedTab === item.name ? 0.7 : 0.4
                  }}
                />
                {item.name}
              </div>
              {(() => {
                const currentTabIndex = navItems.findIndex(i => i.name === selectedTab);
                const isNextTab = index === currentTabIndex + 1;
                const isPrevTab = index === currentTabIndex - 1;
                
                if (item.name !== selectedTab && 
                    ((isNextTab && currentTabIndex < navItems.length - 1) || // Next tab condition
                     (isPrevTab && currentTabIndex > 0)) // Previous tab condition
                ) {
                  const rect = navItemRefs.current[item.name]?.getBoundingClientRect();
                  if (!rect) return null;

                  return (
                    <div className="nav-tooltip" style={{
                      left: `${rect.left + (rect.width / 2)}px`,
                      top: `${rect.bottom + 2}px`
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        justifyContent: 'center'
                      }}>
                        <div style={getKeyStyle(pressedKeys.shift, pressedKeys.shiftColor || getRandomColor())}>
                          shift
                        </div>
                        <span style={{ 
                          opacity: 0.5, 
                          fontSize: '6px',
                          color: '#fff',
                          transform: 'translateY(-0.5px)'
                        }}>+</span>
                        <div style={getKeyStyle(pressedKeys.cmd, pressedKeys.cmdColor || getRandomColor())}>
                          {isMac ? "⌘" : "ctrl"}
                        </div>
                        <span style={{ 
                          opacity: 0.5, 
                          fontSize: '6px',
                          color: '#fff',
                          transform: 'translateY(-0.5px)'
                        }}>+</span>
                        <div style={getKeyStyle(
                          pressedKeys.arrow === (isPrevTab ? 'left' : 'right'),
                          pressedKeys.arrowColor || getRandomColor()
                        )}>
                          {isPrevTab ? "←" : "→"}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ))}
        </div>}
        {showCreateEventModal && (
          <CreateEventModal 
            onEventSelect={onEventSelect}
            setShowCreateEventModal={setShowCreateEventModal}
          />
        )}
      </div>
    </>
  );
} 