import React, { useState, useEffect } from 'react';

const formatTime = (date) => {
  const minutes = date.getUTCMinutes();
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }).toLowerCase();
};

const ViewSchedule = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes()
    ));
  });
  const [isWithinEvent, setIsWithinEvent] = useState(false);
  
  const timelineRef = React.useRef(null);

  useEffect(() => {
    if (isWithinEvent && scheduleData) {
      const startTime = new Date(scheduleData.event.startTime);
      const scrollOffset = ((currentTime - startTime) / (1000 * 60 * 60)) * 76;
      
      window.scrollTo({
        top: scrollOffset - window.innerHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [isWithinEvent, scheduleData, currentTime]);

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      const now = new Date();
      const utcNow = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes()
      ));
      setCurrentTime(utcNow);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        
        if (!eventId) {
          throw new Error('No event ID provided');
        }

        const response = await fetch(`https://serenidad.click/hacktime/getSchedule/${eventId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }

        const data = await response.json();
        setScheduleData(data);

        const now = new Date();
        // Convert to UTC while keeping same hour/minute
        const utcNow = new Date(Date.UTC(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes()
        ));

        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log(
          `User's current time: ${now.toLocaleString('en-US', { timeZone: userTimeZone })}`,
          `\nTimezone: ${userTimeZone}`
        );

        const eventStart = new Date(data.event.startTime);
        const eventEnd = new Date(data.event.endTime);
        
        const isCurrentlyWithinEvent = utcNow >= eventStart && utcNow <= eventEnd;
        setIsWithinEvent(isCurrentlyWithinEvent);

        if (isCurrentlyWithinEvent) {
          console.log('User is viewing during the event! 🎉');
        } else if (utcNow < eventStart) {
          console.log('Event has not started yet. Time until event:', 
            Math.round((eventStart - utcNow) / (1000 * 60 * 60)), 'hours');
        } else {
          console.log('Event has ended. Time since event ended:', 
            Math.round((utcNow - eventEnd) / (1000 * 60 * 60)), 'hours');
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchSchedule();
  }, []);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <p>Loading schedule...</p>
      </div>
    );
  }

  const startTime = new Date(scheduleData.event.startTime);
  const endTime = new Date(scheduleData.event.endTime);

  return (
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
        <div style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <p style={{margin: 0}}>{scheduleData.event.title}</p>
        </div>

        <div 
          ref={timelineRef}
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 24,
            borderTop: "1px solid #EBEBEB",
            position: "relative"
          }}
        >
          {/* Add current time indicator */}
          {isWithinEvent && (
            <div style={{
              position: "absolute",
              top: ((currentTime - startTime) / (1000 * 60 * 60)) * 76,
              left: 40,
              display: "flex",
              alignItems: "center",
              zIndex: 2, marginLeft: -34,
              pointerEvents: "none",
              transform: "translateY(-4px)"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0px"
              }}>
                {/* <div style={{
                  margin: 0,
                  fontSize: "9px",
                  color: "#ff0000",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  backgroundColor: "#ff0000",
                  padding: "1px 4px",
                  borderRadius: "2px 0px 0px 2px",
                  letterSpacing: "0.5px",
                  border: "1px solid #ff0000",
                  height: 8, width: 8, borderRadius: 16, overflow: "hidden",
                }}>
                  
                </div> */}
                <div style={{height: 8, width: 8, backgroundColor: "#BE3A2C", borderRadius: 4,}}>
                
                </div>
                <div style={{
                  maxWidth: "800px",
                  height: "2px", borderRadius: "3px 3px 3px 3px",
                  backgroundColor: "#BE3A2C"
                }} />
              </div>
            </div>
          )}

          {/* Time Grid */}
          {(() => {
            const hoursDiff = Math.ceil((endTime - startTime) / (1000 * 60 * 60));

            return Array.from({ length: hoursDiff }).map((_, index) => {
              const cellTime = new Date(startTime.getTime() + (index * 60 * 60 * 1000));
              const isFirstCell = index === 0;
              const previousCellTime = index > 0 
                ? new Date(startTime.getTime() + ((index - 1) * 60 * 60 * 1000))
                : null;
              const dayChanged = previousCellTime && 
                cellTime.getUTCDate() !== previousCellTime.getUTCDate();

              const showDayLabel = isFirstCell || dayChanged;
              const dayLabel = cellTime.toLocaleString('en-US', { 
                weekday: 'short', 
                timeZone: 'UTC'
              }).toUpperCase();
              
              return (
                <div 
                  key={index} 
                  className="calendar-cell"
                  style={{
                    width: "100%",
                    position: "relative",
                    height: 75,
                    borderBottom: "1px solid #EBEBEB",
                    flexShrink: 0
                  }}
                >
                  <p style={{
                    position: "absolute",
                    fontSize: 9,
                    paddingLeft: 2,
                    width: 28,
                    marginTop: -6,
                    backgroundColor: "#fff",
                    userSelect: "none",
                    color: "#A2A2A2",
                    pointerEvents: "none"
                  }}>
                    {showDayLabel && (
                      <span style={{ display: 'block' }}>{dayLabel}</span>
                    )}
                    {formatTime(cellTime)}
                  </p>
                </div>
              );
            });
          })()}

          {/* Calendar Events */}
          {scheduleData.schedule.map((event, index) => {
            const eventStart = new Date(event.time.start);
            const eventEnd = new Date(event.time.end);
            
            const topOffset = ((eventStart - startTime) / (1000 * 60 * 60)) * 76;
            const duration = (eventEnd - eventStart) / (1000 * 60 * 60);
            const isShortEvent = duration < 1;

            const PADDING = isShortEvent ? 16 : 32;
            const rawHeight = (duration * 76);
            const height = Math.max(8, rawHeight - PADDING);

            return (
              <div 
                key={index}
                style={{
                  position: "absolute",
                  zIndex: 1,
                  top: topOffset,
                  width: "100%"
                }}
              >
                <div style={{margin: 0, padding: "2px 0", height: height}}>
                  <div style={{
                    backgroundColor: event.color ? `rgb(${event.color})` : "#0284c7",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: isShortEvent ? "row" : "column",
                    alignItems: isShortEvent ? "center" : "flex-start",
                    gap: isShortEvent ? 8 : 0,
                    justifyContent: "space-between",
                    height: "100%",
                    padding: isShortEvent ? 8 : 16,
                    width: "calc(100% - 90px)",
                    marginLeft: "40px",
                    userSelect: "none"
                  }}>
                    <div style={{ 
                      fontSize: isShortEvent ? 14 : 16,
                      fontWeight: 500,
                      color: "white"
                    }}>
                      {event.title || 'Untitled Event'}
                    </div>
                    <div style={{ 
                      fontSize: duration <= 0.5 ? 12 : 14,
                      opacity: 0.9,
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      whiteSpace: isShortEvent ? "nowrap" : "normal",
                      color: "white"
                    }}>
                      <span>{formatTime(eventStart)} - {formatTime(eventEnd)}</span>
                      {event.tag && (
                        <>
                          <span>•</span>
                          <span>{event.tag}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ViewSchedule; 