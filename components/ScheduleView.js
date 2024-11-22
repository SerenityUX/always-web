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
              <div style={{display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between"}}>
                <p style={{margin: 0}}>Event Schedule</p>
<div style={{display: "flex", flexDirection: "row", gap: 16}}>
<div 
                  onClick={() => window.open(`/viewschedule?id=${selectedEvent.id}`, '_blank')}

                style={{width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, cursor: "pointer", backgroundColor: "#737373"}}>
                  <img style={{height: 16, width: 16, filter: "brightness(0) invert(1)"}} src="./icons/share.svg"/>
                </div>
                <div 
                  onClick={() => window.open(`https://serenidad.click/hacktime/getSchedule/${selectedEvent.id}`, '_blank')}

                style={{width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, cursor: "pointer", backgroundColor: "#737373"}}>
                  <p style={{fontSize: 8, margin: 0, color: "#fff", fontWeight: 800}}>API</p>
                </div>
                </div>
              </div>

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
                  .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) // Sort by start time
                  .map((event, index, events) => {
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
                    const isShortEvent = duration < 1;

                    // Adjust height calculation to account for padding
                    const PADDING = isShortEvent ? 16 : 32; // 8px top + 8px bottom for short events, 16px each for tall
                    const rawHeight = (duration * 76);
                    const height = Math.max(8, rawHeight - PADDING); // Minimum content height of 40px

                    // Find overlapping events
                    const overlappingEvents = events.filter(otherEvent => {
                      if (otherEvent === event) return false;
                      const otherStart = new Date(otherEvent.startTime);
                      const otherEnd = new Date(otherEvent.endTime);
                      return isTimeOverlapping(eventStart, eventEnd, otherStart, otherEnd);
                    });

                    // Calculate offset and width based on overlaps
                    const overlapGroup = overlappingEvents.length + 1;
                    const overlapIndex = overlappingEvents.filter(e => 
                      new Date(e.startTime) < eventStart || 
                      (new Date(e.startTime).getTime() === eventStart.getTime() && e.id < event.id)
                    ).length;

                    const baseWidth = "calc(100% - 48px)"; // Full width minus margins
                    const adjustedWidth = `calc((${baseWidth}) / ${overlapGroup})`;
                    const leftOffset = `calc(40px + (${adjustedWidth} * ${overlapIndex}))`;

                    return (
                      <div key={index} style={{
                        position: "absolute",
                        zIndex: selectedCalendarEvent?.id === event.id ? 103 : 2,
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
                                                      ref={el => {
                                                        // Auto-focus if title is empty when modal opens
                                                        if (el && !selectedCalendarEvent.title) {
                                                          el.focus();
                                                        }
                                                      }}
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
                                                        minWidth: 150,
                                                        transition: "background-color 0.2s",
                                                        userSelect: "none", // Prevent selection when not editing
                                                        WebkitUserSelect: "none",
                                                        "&:hover": {
                                                          backgroundColor: "rgba(0, 0, 0, 0.05)"
                                                        },
                                                        "&:focus": {
                                                          userSelect: "text", // Allow selection when editing
                                                          WebkitUserSelect: "text"
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
                                                      <img src="./icons/label.svg" style={{width: 24, height: 24}}/>
                                                      <select 
                                                        value={selectedCalendarEvent.tag || "Untagged"}
                                                        onChange={async (e) => {
                                                          const selectedValue = e.target.value;
                                                          
                                                          if (selectedValue === "New Tag") {
                                                            const newTag = prompt("Enter new tag name:");
                                                            
                                                            if (newTag && newTag.trim()) {
                                                              try {
                                                                // Create the new tag
                                                                const createResponse = await fetch('https://serenidad.click/hacktime/createAvailableTag', {
                                                                  method: 'POST',
                                                                  headers: {
                                                                    'Content-Type': 'application/json',
                                                                  },
                                                                  body: JSON.stringify({
                                                                    token: localStorage.getItem('token'),
                                                                    eventId: selectedEventId,
                                                                    tag: newTag.trim()
                                                                  }),
                                                                });

                                                                if (!createResponse.ok) {
                                                                  const error = await createResponse.json();
                                                                  throw new Error(error.error || 'Failed to create tag');
                                                                }

                                                                // Update local state to include the new tag
                                                                setSelectedEvent(prev => ({
                                                                  ...prev,
                                                                  availableTags: [...(prev.availableTags || []), newTag.trim()]
                                                                }));

                                                                // Set the new tag as the selected tag for the calendar event
                                                                const updateResponse = await fetch('https://serenidad.click/hacktime/updateCalendarEvent', {
                                                                  method: 'POST',
                                                                  headers: {
                                                                    'Content-Type': 'application/json',
                                                                  },
                                                                  body: JSON.stringify({
                                                                    token: localStorage.getItem('token'),
                                                                    calendarEventId: selectedCalendarEvent.id,
                                                                    startTime: selectedCalendarEvent.startTime,
                                                                    endTime: selectedCalendarEvent.endTime,
                                                                    title: selectedCalendarEvent.title,
                                                                    color: selectedCalendarEvent.color,
                                                                    tag: newTag.trim()
                                                                  }),
                                                                });

                                                                if (!updateResponse.ok) {
                                                                  throw new Error('Failed to update calendar event');
                                                                }

                                                                // Update selected calendar event state
                                                                setSelectedCalendarEvent(prev => ({
                                                                  ...prev,
                                                                  tag: newTag.trim()
                                                                }));
                                                              } catch (error) {
                                                                console.error('Failed to create/update tag:', error);
                                                                alert(error.message);
                                                              }
                                                            }
                                                          } else {
                                                            // Handle regular tag selection
                                                            const newLabel = selectedValue === "Untagged" ? null : selectedValue;
                                                            
                                                            try {
                                                              const response = await fetch('https://serenidad.click/hacktime/updateCalendarEvent', {
                                                                method: 'POST',
                                                                headers: {
                                                                  'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                  token: localStorage.getItem('token'),
                                                                  calendarEventId: selectedCalendarEvent.id,
                                                                  startTime: selectedCalendarEvent.startTime,
                                                                  endTime: selectedCalendarEvent.endTime,
                                                                  title: selectedCalendarEvent.title,
                                                                  color: selectedCalendarEvent.color,
                                                                  tag: newLabel
                                                                }),
                                                              });

                                                              if (!response.ok) {
                                                                throw new Error('Failed to update calendar event');
                                                              }

                                                              // Update local state
                                                              setSelectedCalendarEvent(prev => ({
                                                                ...prev,
                                                                tag: newLabel
                                                              }));

                                                              setSelectedEvent(prev => ({
                                                                ...prev,
                                                                calendar_events: prev.calendar_events.map(evt => 
                                                                  evt.id === selectedCalendarEvent.id 
                                                                    ? { ...evt, tag: newLabel } 
                                                                    : evt
                                                                )
                                                              }));

                                                            } catch (error) {
                                                              console.error('Failed to update tag:', error);
                                                              alert(error.message);
                                                            }
                                                          }
                                                        }}
                                                        style={{
                                                          margin: 0,
                                                          padding: "4px 8px",
                                                          backgroundColor: "#F3F2F8",
                                                          borderRadius: 4,
                                                          minWidth: 120,
                                                          fontSize: 16,
                                                          border: "none",
                                                          cursor: "pointer",
                                                          appearance: "none",
                                                          backgroundImage: "url('./icons/chevron-down.svg')",
                                                          backgroundRepeat: "no-repeat",
                                                          backgroundPosition: "right 8px center",
                                                          backgroundSize: "16px",
                                                          paddingRight: "28px"
                                                        }}
                                                      >
                                                        <option value="Untagged">Untagged</option>
                                                        {selectedEvent?.availableTags?.map((tag, index) => (
                                                          <option key={index} value={tag}>
                                                            {tag}
                                                          </option>
                                                        ))}
                                                        <option value="New Tag">+ New Tag</option>
                                                      </select>
                                                    </div>
                                                    <div style={{display: "flex", alignItems: "center", gap: 8}}>
                                                      <img src="./icons/calendar.svg" style={{width: 24, height: 24}}/>
                                                      <p style={{margin: 0, fontSize: 16}}>
                                                      {new Date(selectedCalendarEvent.startTime).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                      timeZone: 'UTC'
                                    })}

                                                      </p>
                                                      
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
                        <div style={{margin: "0", padding: "2px 0", height: height}}>
                          <div 
                            onClick={() => setSelectedCalendarEvent(event)}                            
                            style={{
                              backgroundColor,
                              borderRadius: 8,
                              display: "flex",
                              flexDirection: isShortEvent ? "row" : "column",
                              alignItems: isShortEvent ? "center" : "flex-start",
                              gap: isShortEvent ? 8 : 0,
                              justifyContent: "space-between",
                              height: "100%",
                              padding: isShortEvent ? 8 : 16,
                              width: adjustedWidth,
                              border: "1px solid #fff",
                              marginLeft: leftOffset,
                              userSelect: "none",
                              cursor: "pointer",
                            }}
                          >
                            <p
                              ref={el => {
                                // Auto-focus if this is the newly created event
                                if (el && event.id === newEventId) {
                                  el.focus();
                                  setNewEventId(null);
                                }
                              }}
                              contentEditable
                              suppressContentEditableWarning
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              onBlur={(e) => {
                                const newTitle = e.target.innerText.trim();
                                if (newTitle !== event.title) {
                                  // Update the title if it changed, even if empty
                                  handleEventTitleUpdate(event.id, newTitle);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.target.blur();
                                } else if (e.key === 'Escape') {
                                  e.target.blur();
                                }
                              }}
                              style={{
                                margin: 0,
                                fontSize: isShortEvent ? 14 : 16,
                                color: "#fff",
                                outline: 'none',
                                cursor: "text",
                                minWidth: 150,
                                padding: "2px 0px",
                                borderRadius: "4px",
                                transition: "background-color 0.2s",
                                wordWrap: "break-word",
                                overflowWrap: "break-word",
                                whiteSpace: isShortEvent ? "nowrap" : "pre-wrap",
                                minHeight: isShortEvent ? "auto" : "24px",
                                flex: isShortEvent ? 1 : "auto",
                                userSelect: "none", // Prevent selection when not editing
                                WebkitUserSelect: "none", // For Safari support
                                "&:focus": {
                                  userSelect: "text", // Allow selection only when focused
                                  WebkitUserSelect: "text"
                                }
                              }}
                            >
                              {event.title}
                            </p>
                            <p style={{
                              margin: 0, 
                              fontSize: duration <= 0.5 ? 12 : 14,
                              color: "#fff",
                              opacity: 0.8,
                              whiteSpace: "nowrap"
                            }}>
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
                      <div 
                        key={index} 
                        className="calendar-cell"
                        style={{
                          width: "100%",
                          position: "relative",
                          height: 75,
                          borderBottom: "1px solid #EBEBEB",
                          flexShrink: 0,
                          cursor: "pointer"
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
                          {cellTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            timeZone: 'UTC',
                            hour12: true 
                          })}
                        </p>
                        <div className="calendar-cell-hover" style={{
                          position: "absolute",
                          left: "40px",
                          right: "8px",
                          top: 0,
                          bottom: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          color: "rgba(0, 0, 0, 0.13)",
                          pointerEvents: "none",
                          backgroundColor: "rgba(0, 0, 0, 0.02)"
                        }}>
                          +
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
    )
}
