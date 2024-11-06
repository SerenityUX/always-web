import React from 'react';

const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  
const formatTime = (date) => {
    const minutes = date.getUTCMinutes();
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: minutes === 0 ? undefined : '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).toLowerCase();
  };


export const ScheduleView = ({
  selectedEvent,
  selectedCalendarEvent,
  setSelectedCalendarEvent,
  setSelectedTask,
  newEventId,
  setNewEventId,
  handleDeleteConfirmation,
  handleEventTitleUpdate,
  handleTimeUpdate,
  handleDeleteCalendarEvent,
  handleColorUpdate,
  selectedEventId,
  animatingColor,
  setSelectedEvent,
  COLORS,
  MAX_DURATION,
  isWithinEventBounds,
  isTimeOverlapping,
  timeStringToDate,
}) => {
    return(
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
                
                {selectedCalendarEvent != null && <div
                    onClick={(e) => {
                      // Don't deselect if clicking on the contentEditable field
                      if (e.target.contentEditable === 'true') {
                        return;
                      }
                      // Only deselect if clicking the background
                      if (e.target === e.currentTarget) {
                        setSelectedCalendarEvent(null);
                        setSelectedTask(null)

                      }
                    }}
                style={{
                  width: "100000vw",
                  
                  alignItems: "center",
                  justifyContent: "center",
                  position: "fixed",
                  marginLeft: -10000,
                  zIndex: 102,
                  marginTop: "-132000px",
                  height: "1000000000000vh",
                  display: "flex",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
                
                >
                
                </div>}
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
            
                        zIndex: selectedCalendarEvent?.id === event.id ? 103 : 2, // Update this line
                        top: topOffset,
                        width: "100%"
                      }}>
                        {selectedCalendarEvent?.id == event.id && 
                          
                                                <div style={{position: "absolute", fontSize: "16", cursor: "auto", left: 800, borderRadius: 8, width: 300, backgroundColor: "#fff"}}>
                                                  <div style={{width: "calc(100% - 24px)", borderRadius: "16px 16px 0px 0px", paddingTop: 8, paddingBottom: 8, justifyContent: "space-between", paddingLeft: 16, paddingRight: 8, alignItems: "center", display: "flex", backgroundColor: "#F6F8FA"}}>
                                                  <p style={{margin: 0, fontSize: 14}}>Edit Calendar Event</p>
                                                  <img 
                                                    onClick={() => handleDeleteConfirmation(selectedCalendarEvent.id)}
                                                    style={{width: 24, height: 24, cursor: "pointer"}} 
                                                    src="/icons/trash.svg"
                                                  />
                                                  </div> 
                                                  <div style={{display: "flex", gap: 16, padding: 16, flexDirection: "column"}}>
                                                    <p 
                                                      contentEditable
                                                      suppressContentEditableWarning
                                                      onBlur={(e) => {
                                                        const newTitle = e.target.innerText.trim();
                                                        if (newTitle !== selectedCalendarEvent.title) {
                                                          // Update both states immediately for a smoother UI experience
                                                          setSelectedCalendarEvent(prev => ({
                                                            ...prev,
                                                            title: newTitle
                                                          }));
                                                          setSelectedEvent(prev => ({
                                                            ...prev,
                                                            calendar_events: prev.calendar_events.map(evt => 
                                                              evt.id === selectedCalendarEvent.id ? { ...evt, title: newTitle } : evt
                                                            )
                                                          }));
                                                          handleEventTitleUpdate(selectedCalendarEvent.id, newTitle);
                                                        }
                                                      }}
                                                      onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                          e.preventDefault();
                                                          e.target.blur();
                                                        }
                                                      }}
                                                      style={{
                                                        margin: 0, 
                                                        fontSize: 24, 
                                                        cursor: "text", 
                                                        color: "#000",
                                                        outline: "none",
                                                        padding: "2px 4px",
                                                        borderRadius: "4px",
                                                        transition: "background-color 0.2s",
                                                        "&:hover": {
                                                          backgroundColor: "rgba(0, 0, 0, 0.05)"
                                                        }
                                                      }}
                                                    >
                                                      {selectedCalendarEvent.title}
                                                    </p>
                                                    <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                      <img src="./icons/clock.svg" style={{width: 24, height: 24}}/>
                                                      <div style={{position: "relative"}}>
                                                        <p 
                                                          onClick={(e) => {
                                                            const timeInput = e.currentTarget.nextElementSibling;
                                                            timeInput.showPicker();
                                                          }}
                                                          style={{
                                                            margin: 0, 
                                                            fontSize: 16,
                                                            cursor: "pointer",
                                                            padding: 4, 
                                                            backgroundColor: "#F3F2F8", 
                                                            borderRadius: 4,
                                                            minWidth: 70,
                                                            textAlign: "center"
                                                          }}
                                                        >
                                                          {formatTime(new Date(selectedCalendarEvent.startTime))}
                                                        </p>
                                                        <input 
                                                          type="time"
                                                          value={`${new Date(selectedCalendarEvent.startTime).getUTCHours().toString().padStart(2, '0')}:${new Date(selectedCalendarEvent.startTime).getUTCMinutes().toString().padStart(2, '0')}`}
                                                          onChange={async (e) => {
                                                            const newStartTime = timeStringToDate(e.target.value, new Date(selectedCalendarEvent.startTime));
                                                            const duration = new Date(selectedCalendarEvent.endTime) - new Date(selectedCalendarEvent.startTime);
                                                            const newEndTime = new Date(newStartTime.getTime() + duration);
                                                            
                                                            await handleTimeUpdate(selectedCalendarEvent.id, newStartTime, newEndTime);
                                                          }}
                                                          style={{
                                                            position: "absolute",
                                                            opacity: 0,
                                                            pointerEvents: "none"
                                                          }}
                                                        />
                                                      </div>
                                                      <p style={{margin: 0, fontSize: 16}}>-</p>
                                                      <div style={{position: "relative"}}>
                                                        <p 
                                                          onClick={(e) => {
                                                            const timeInput = e.currentTarget.nextElementSibling;
                                                            timeInput.showPicker();
                                                          }}
                                                          style={{
                                                            margin: 0, 
                                                            cursor: "pointer",
                                                            padding: 4, 
                                                            backgroundColor: "#F3F2F8", 
                                                            borderRadius: 4,
                                                            minWidth: 70,
                                                            textAlign: "center",
                                                            fontSize: 16
                                                          }}
                                                        >
                                                          {formatTime(new Date(selectedCalendarEvent.endTime))}
                                                        </p>
                                                        <input 
                                                          type="time"
                                                          value={`${new Date(selectedCalendarEvent.endTime).getUTCHours().toString().padStart(2, '0')}:${new Date(selectedCalendarEvent.endTime).getUTCMinutes().toString().padStart(2, '0')}`}
                                                          onChange={async (e) => {
                                                            const startTime = new Date(selectedCalendarEvent.startTime);
                                                            let newEndTime = timeStringToDate(e.target.value, new Date(selectedCalendarEvent.endTime));
                                                            
                                                            // If end time is before start time, check if moving to next day would be within max duration
                                                            if (newEndTime < startTime) {
                                                              const nextDayEndTime = new Date(newEndTime.getTime() + 24 * 60 * 60 * 1000);
                                                              const duration = nextDayEndTime - startTime;
                                                              
                                                              if (duration <= MAX_DURATION) {
                                                                newEndTime = nextDayEndTime;
                                                              } else {
                                                                return; // Don't allow the change if it would exceed max duration
                                                              }
                                                            }
                                                            
                                                            await handleTimeUpdate(selectedCalendarEvent.id, startTime, newEndTime);
                                                          }}
                                                          style={{
                                                            position: "absolute",
                                                            opacity: 0,
                                                            pointerEvents: "none"
                                                          }}
                                                        />
                                                      </div>
                                                    </div>
                                                    <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                      <img src="./icons/calendar.svg" style={{width: 24, height: 24}}/>
                                                      <p style={{margin: 0, fontSize: 16}}>Friday, November 1, 2024</p>
                                                    </div>
                                                    <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                      <img src="./icons/paint.svg" style={{width: 24, height: 24}}/>
                                                      <p style={{margin: 0, fontSize: 16}}>Calendar Color</p>
                                                    </div>
                                                    <div style={{display: "flex", height: 36, alignItems: "center", flexDirection: "row", gap: 12}}>
                                                      {COLORS.map((colorString, index) => (
                                                        <div 
                                                          key={index}
                                                          onClick={() => handleColorUpdate(selectedCalendarEvent.id, colorString)}
                                                          style={{
                                                            backgroundColor: `rgb(${colorString})`,
                                                            cursor: "pointer",
                                                            borderRadius: "100%",
                                                            height: selectedCalendarEvent.color === colorString || animatingColor === colorString ? 36 : 32,
                                                            width: selectedCalendarEvent.color === colorString || animatingColor === colorString ? 36 : 32,
                                                            opacity: selectedCalendarEvent.color === colorString || animatingColor === colorString ? 1 : 0.5,
                                                            transition: "all 0.2s ease"
                                                          }}
                                                        />
                                                      ))}
                                                    </div>
                                                  </div>
                                                </div>
                        }
                        <div style={{margin: "0 24px", padding: 8, height: height}}>
                          <div 
                                onClick={() => {
                                  setSelectedCalendarEvent(event);
                                  console.log("Selected Calendar Event:", event);
                                }}                            
                              
                                style={{
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
                              cursor: "pointer",
                              ...(duration <= 1 && { justifyContent: "center" }) // Center text if duration is 1 hour or less
                            }}
                          >
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
                              onClick={(e) => {
                                e.stopPropagation(); // Stop the click from bubbling up
                              }}
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
                                padding: "2px 0px",
                                borderRadius: "4px",
                                transition: "background-color 0.2s",
                                wordWrap: "break-word",
                                overflowWrap: "break-word",
                                whiteSpace: "pre-wrap",
                                minHeight: "24px",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 255, 255, 0.1)"
                                },
                                ...(duration <= 1 && { textAlign: "start" }) // Center text if duration is 1 hour or less
                              }}
                            >
                              {event.title}
                            </p>
                            <p style={{margin: 0, fontSize: 14, color: "#fff",  opacity: 0.8, ...(duration <= 1 && { textAlign: "start" })}}>
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
    )
}
