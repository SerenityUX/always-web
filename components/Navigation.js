import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import ProfileImage from './ProfileImage';
import ProfilePictureUpload from './ProfilePictureUpload';

export default function Navigation({ user, onUserUpdate, selectedEventId, onEventSelect }) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  const { tab, event } = router.query;
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const eventDropdownRef = useRef(null);

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
    if (currentEvent) {
      setSelectedEvent(currentEvent);
    } else if (defaultEvent) {
      setSelectedEvent(defaultEvent);
    }
  }, [user, event, currentEvent, defaultEvent]);

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

  const navItems = [
    "Run of Show",
    "Schedule",
    "Announcements",
    "Team"
  ];

  const handleTabClick = (item) => {
    router.push(`/?event=${selectedEvent?.id}&tab=${encodeURIComponent(item)}`, undefined, { shallow: true });
  };

  const handleEventSelect = (eventObj) => {
    onEventSelect(eventObj.id);
    setShowEventDropdown(false);
    localStorage.setItem('lastVisited', eventObj.id);
    router.push(`/?eventId=${eventObj.id}${tab ? `&tab=${tab}` : ''}`, undefined, { shallow: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/signup');
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

  return (
    <div style={{backgroundColor: "#F6F8FA", overflow: "visible", borderBottom: '1px solid #EBEBEB'}}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 32, paddingTop: 16, paddingRight: 32}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 16}}>
        <h1 style={{margin: 0, fontSize: 24, height: 24, fontWeight: 600, opacity: 0.9}}>Schedule Band</h1>
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
              padding: 8
            }}>
              {eventsList.map((eventObj, index, array) => (
                <div
                  key={eventObj.id}
                  onClick={() => handleEventSelect(eventObj)}
                  className="nav-item"
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #EBEBEB"
                  }}
                >
                  <p style={{
                    margin: 0, 
                    fontSize: 16, 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    whiteSpace: "nowrap"
                  }}>
                    {eventObj.title}
                  </p>
                </div>
              ))}
              <div
                onClick={() => {
                  console.log("create event modal appears");
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
        </div>
        <div ref={profileRef} style={{height: 32, overflow: "visible", width: 32, position: "relative"}}>
          <div onClick={() => setShowProfile(!showProfile)} style={{cursor: "pointer"}}>
            <ProfileImage
              imageUrl={user?.profile_picture_url}
              name={user?.name}
              size={32}
            />
          </div>
          {showProfile && (
            <div style={{position: "fixed", zIndex: 100, display: "flex", gap: 8, flexDirection: "column", border: "1px solid #EBEBEB", width: 196, padding: 12, backgroundColor: "#fff", borderRadius: 16, top: 56, right: 32}}>
              <div style={{display: "flex", border: "1px solid #EBEBEB", alignItems: "center", backgroundColor: "#F6F8FA", padding: 16, paddingTop: 8, gap: 14, borderRadius: 8, justifyContent: "center", flexDirection: "column"}}>
                <div style={{height: 8, width: 8, border: "1px solid #EBEBEB", backgroundColor: "#fff", borderRadius: "100%"}}></div>
                <div style={{position: "relative", height: 96, width: 96}}>
                  <ProfileImage
                    imageUrl={user?.profile_picture_url}
                    name={user?.name}
                    size={96}
                  />
                  <ProfilePictureUpload onUpload={handleProfilePictureUpdate}>
                    <img 
                      style={{
                        height: 16,
                        width: 16,
                        padding: 6,
                        cursor: "pointer",
                        backgroundColor: "#fff",
                        borderRadius: "100%",
                        border: "1px solid #EBEBEB",
                        position: "absolute",
                        right: 0,
                        bottom: 0
                      }}
                      src="./icons/edit.svg"
                      alt="Edit profile picture"
                    />
                  </ProfilePictureUpload>
                </div>
                <p style={{margin: 0}}>{user?.name}</p>
              </div>
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
      <div style={{display: "flex", gap: 24, paddingLeft: 32, paddingTop: 12, paddingRight: 32}}>
        {navItems.map((item) => (
          <div 
            key={item}
            style={{
              paddingBottom: 8,
              borderBottom: selectedTab === item ? "2px solid #59636E" : "none"
            }}
            onClick={() => handleTabClick(item)}
          >
            <h2 
              className="nav-item" 
              style={{
                margin: 0, 
                padding: "4px 6px",
                borderRadius: 6,
                color: selectedTab === item ? "rgba(0, 0, 0, 0.9)" : "rgba(0, 0, 0, 0.5)", 
                fontSize: 16, 
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              {item}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
} 