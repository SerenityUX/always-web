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

        <div style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 24,
          borderTop: "1px solid #EBEBEB",
          position: "relative"
        }}>
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
                    width: "calc(100% - 48px)",
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