import React from 'react';
import { TaskCard } from './TaskCard';

const COLORS = [
    "2,147,212",
    "218,128,0",
    "8,164,42",
    "142,8,164",
    "190,58,44",
    "89,89,89"
  ];

export const RunOfShow = ({
  selectedEvent,
  user,
  MAX_DURATION,
  isTimeOverlapping,
  selectedEventId,
  setNewEventId,
  handleEventTitleUpdate,
  newEventId,
  animatingColor,
  setSelectedCalendarEvent,
  isWithinEventBounds,
  selectedCalendarEvent,
  titleInputRef,
  handleDeleteConfirmation,
  setSelectedEvent,
  selectedTask,
  setSelectedTask,
  selectedTaskColumn,
  setSelectedTaskColumn,
  editingTaskTitle,
  setEditingTaskTitle,
  editingTaskDescription,
  setEditingTaskDescription,
  handleTaskUpdate,
  handleDeleteTask,
  setIsInvitingNewUser
}) => {


    
      const timeStringToDate = (timeStr, baseDate) => {
        const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
        return new Date(Date.UTC(
          baseDate.getUTCFullYear(),
          baseDate.getUTCMonth(),
          baseDate.getUTCDate(),
          hours,
          minutes,
          0,
          0
        ));
      };
    
      
      const handleTimeUpdate = async (calendarEventId, newStartTime, newEndTime) => {
        // Validate times are within main event bounds
        const mainEventStart = new Date(selectedEvent.startTime);
        const mainEventEnd = new Date(selectedEvent.endTime);
        
        // Calculate duration
        const duration = newEndTime - newStartTime;
        
        // If duration would exceed max, don't allow it
        if (duration > MAX_DURATION) {
          return false;
        }
    
        // If end time is before start time and the duration would be reasonable,
        // move end time to next day
        if (newEndTime < newStartTime && (newEndTime.getTime() + 24 * 60 * 60 * 1000 - newStartTime.getTime()) <= MAX_DURATION) {
          newEndTime = new Date(newEndTime.getTime() + 24 * 60 * 60 * 1000);
        }
        
        if (!isWithinEventBounds(newStartTime, newEndTime, mainEventStart, mainEventEnd)) {
          alert('Event must be within the main event time bounds');
          return false;
        }
    
        // Check for overlaps with other events
        const hasOverlap = selectedEvent?.calendar_events?.some(event => {
          if (event.id === calendarEventId) return false; // Skip current event
          const existingStart = new Date(event.startTime);
          const existingEnd = new Date(event.endTime);
          return isTimeOverlapping(newStartTime, newEndTime, existingStart, existingEnd);
        });
    
        if (hasOverlap) {
          alert('Cannot overlap with existing events');
          return false;
        }
    
        try {
          const response = await fetch('https://serenidad.click/hacktime/updateCalendarEvent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: localStorage.getItem('token'),
              calendarEventId,
              startTime: newStartTime.toISOString(),
              endTime: newEndTime.toISOString()
            }),
          });
    
          if (!response.ok) {
            throw new Error('Failed to update event time');
          }
    
          // Update local state
          setSelectedEvent(prev => ({
            ...prev,
            calendar_events: prev.calendar_events.map(evt => 
              evt.id === calendarEventId 
                ? { ...evt, startTime: newStartTime.toISOString(), endTime: newEndTime.toISOString() } 
                : evt
            )
          }));
    
          setSelectedCalendarEvent(prev => ({
            ...prev,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString()
          }));
    
          return true;
        } catch (error) {
          console.error('Failed to update event time:', error);
          return false;
        }
      };
      
      
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

      
  // Helper function to create preview element
  const createPreviewElement = () => {
    const preview = document.createElement('div');
    preview.style.position = 'fixed';
    preview.style.width = '215px';
    preview.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
    preview.style.border = '2px dashed rgb(37, 99, 235)';
    preview.style.borderRadius = '6px';
    preview.style.zIndex = '1000';
    preview.style.pointerEvents = 'none';
    
    const timeDisplay = document.createElement('div');
    timeDisplay.style.padding = '8px';
    timeDisplay.style.fontSize = '12px';
    timeDisplay.style.color = 'rgb(37, 99, 235)';
    timeDisplay.style.fontWeight = 'bold';
    preview.appendChild(timeDisplay);
    
    const label = document.createElement('div');
    label.textContent = 'New Task';
    label.style.padding = '8px';
    label.style.fontSize = '14px';
    label.style.color = 'rgb(37, 99, 235)';
    preview.appendChild(label);
    
    document.body.appendChild(preview);
    return preview;
  };

  // Calculate hours difference
  const hoursDiff = selectedEvent ? 
    Math.ceil((new Date(selectedEvent.endTime) - new Date(selectedEvent.startTime)) / (1000 * 60 * 60)) : 
    0;
  return (
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
              <div 
              data-column-id="Event Schedule"
              style={{
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
                      let dragStartTime = new Date(startTime.getTime() + (hoursFromStart * 60 * 60 * 1000));
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

{(selectedCalendarEvent != null || selectedTask != null) && 
<div
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
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "fixed",
    zIndex: 102,
    marginTop: "-132px",
    height: "100vh",
    display: "flex",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  }}
>
</div>
}

                  {selectedCalendarEvent && (
                    <div style={{
                      position: "absolute",
                      zIndex: 103,
                      top: ((new Date(selectedCalendarEvent.startTime) - new Date(selectedEvent.startTime)) / (1000 * 60 * 60)) * 76
                    }}>

                      <div style={{marginLeft: 24, position: "relative", marginTop: 0, padding: 8, height: ((new Date(selectedCalendarEvent.endTime) - new Date(selectedCalendarEvent.startTime)) / (1000 * 60 * 60)) * 76 - 48}}>
                        
                        <div style={{position: "absolute", cursor: "auto", left: 200, borderRadius: 8, width: 400, backgroundColor: "#fff"}}>
                          <div style={{width: "calc(100% - 24px)", borderRadius: "16px 16px 0px 0px", paddingTop: 8, paddingBottom: 8, justifyContent: "space-between", paddingLeft: 16, paddingRight: 8, alignItems: "center", display: "flex", backgroundColor: "#F6F8FA"}}>
                          <p 
                          onClick={() => console.log(new Date(selectedCalendarEvent.endTime))}
                          style={{margin: 0, fontSize: 14}}>Edit Calendar Event</p>
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
                                    cursor: "pointer",
                                    padding: 4, 
                                    backgroundColor: "#F3F2F8", 
                                    borderRadius: 4,
                                    minWidth: 70,
                                    textAlign: "center",
                                    fontSize: 16
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
                              <p style={{margin: 0}}>-</p>
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
                              <p style={{margin: 0,

fontSize: 16


                              }}>Friday, November 1, 2024</p>
                            </div>
                            <div style={{display: "flex", alignItems: "center", gap: 8}}>
                              <img src="./icons/paint.svg" style={{width: 24, height: 24}}/>
                              <p style={{margin: 0}}>Calendar Color</p>
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
                        <div 
                          onClick={(e) => {
                            // Don't deselect if clicking on the contentEditable field
                            if (e.target.contentEditable === 'true') {
                              return;
                            }
                            setSelectedCalendarEvent(null);
                            setSelectedTask(null)

                          }}
                          style={{
                            backgroundColor: selectedCalendarEvent.color ? `rgb(${selectedCalendarEvent.color})` : "#DA8000",
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
                            contentEditable
                            suppressContentEditableWarning
                            onClick={(e) => {
                              e.stopPropagation(); // Stop the click from bubbling up
                            }}
                            onBlur={(e) => {
                              const newTitle = e.target.innerText.trim();
                              if (newTitle !== selectedCalendarEvent.title) {
                                handleEventTitleUpdate(selectedCalendarEvent.id, newTitle);
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
                              minHeight: "24px"
                            }}
                          >
                            {selectedCalendarEvent.title}
                          </p>
                          <p style={{margin: 0, fontSize: 14, color: "#fff", opacity: 0.8}}>
                            {formatTime(new Date(selectedCalendarEvent.startTime))} - {formatTime(new Date(selectedCalendarEvent.endTime))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}


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
                <div 
                data-column-id="You"
                style={{display: "flex", flexDirection: "column", flexShrink: 0}}>
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
                  
                  {/* Add task mapping for current user */}
                  <div style={{position: "relative"}}>
                    {selectedEvent?.tasks
                      ?.filter(task => task.assignedTo.some(person => person.email === user.email))
                      .map((task, index) => (
                        <TaskCard 
                          key={index}
                          task={task}
                          titleInputRef={titleInputRef}
                          selectedEvent={selectedEvent}
                          setSelectedEvent={setSelectedEvent}  // Add this prop
                          dayStart={new Date(selectedEvent.startTime)}
                          setSelectedTask={setSelectedTask}
                          selectedTask={selectedTask}
                          columnId={"You"}
                          setSelectedTaskColumn={setSelectedTaskColumn}
                          selectedTaskColumn={selectedTaskColumn}
                          editingTaskTitle={editingTaskTitle}
                          setEditingTaskTitle={setEditingTaskTitle}
                          editingTaskDescription={editingTaskDescription}
                          setEditingTaskDescription={setEditingTaskDescription}
                          handleTaskUpdate={handleTaskUpdate}
                          handleDeleteTask={handleDeleteTask}  // Add this prop
                        />
                      ))}
                  </div>
                  
                  {/* Existing hour grid */}
                  {Array.from({ length: hoursDiff }).map((_, index) => (
                    <div 
                    key={index} 
                    onMouseDown={(e) => {
                      const targetElement = e.currentTarget;
                      const rect = targetElement.getBoundingClientRect();
                      const initialY = e.clientY;
                      let dragStarted = false;
                      let previewElement = null;
                      
                      const columnElement = e.target.closest('[data-column-id]');
                      const columnId = columnElement ? columnElement.dataset.columnId : 'unknown';
                      
                      // Determine the assignee based on column
                      let assigneeEmail;
                      if (columnId === 'You') {
                        assigneeEmail = user.email;
                      } else {
                        const teamMember = selectedEvent?.teamMembers?.find(member => member.name === columnId);
                        assigneeEmail = teamMember?.email;
                      }
                      
                      if (!assigneeEmail) {
                        console.error('No valid assignee found for column:', columnId);
                        return;
                      }
                    
                      const initialMousePos = {
                        x: e.clientX,
                        y: e.clientY
                      };
                    
                      const startY = initialY - rect.top + (index * 76);
                      const hoursFromStart = Math.floor(startY / 76);
                      const startTime = new Date(selectedEvent.startTime);
                      let dragStartTime = new Date(startTime.getTime() + (hoursFromStart * 60 * 60 * 1000));
                      let dragEndTime = dragStartTime;
                    
                      // Create preview element function
                      const createPreviewElement = () => {
                        const preview = document.createElement('div');
                        preview.style.position = 'fixed'; // Changed from 'absolute' to 'fixed'
                        preview.style.width = '215px';
                        preview.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                        preview.style.border = '2px dashed rgb(37, 99, 235)';
                        preview.style.borderRadius = '6px';
                        preview.style.zIndex = '1000';
                        preview.style.pointerEvents = 'none';
                        
                        // Add time display
                        const timeDisplay = document.createElement('div');
                        timeDisplay.style.padding = '8px';
                        timeDisplay.style.fontSize = '12px';
                        timeDisplay.style.color = 'rgb(37, 99, 235)';
                        timeDisplay.style.fontWeight = 'bold';
                        preview.appendChild(timeDisplay);
                        
                        // Add "New Task" label
                        const label = document.createElement('div');
                        label.textContent = 'New Task';
                        label.style.padding = '8px';
                        label.style.fontSize = '14px';
                        label.style.color = 'rgb(37, 99, 235)';
                        preview.appendChild(label);
                        
                        document.body.appendChild(preview);
                        return preview;
                      };
                    
                      // Update preview element function
                      const handleMouseMove = (moveEvent) => {
                        const distance = Math.sqrt(
                          Math.pow(moveEvent.clientX - initialMousePos.x, 2) + 
                          Math.pow(moveEvent.clientY - initialMousePos.y, 2)
                        );
                      
                        if (!dragStarted && distance >= 5) {
                          dragStarted = true;
                          previewElement = createPreviewElement();
                        }
                      
                        if (dragStarted) {
                          // Calculate hours from start for both positions
                          const startHours = Math.floor((initialY - rect.top + (index * 76)) / 76);
                          const endHours = Math.ceil((moveEvent.clientY - rect.top + (index * 76)) / 76);
                          
                          // Update drag times
                          dragStartTime = new Date(startTime.getTime() + (startHours * 60 * 60 * 1000));
                          dragEndTime = new Date(startTime.getTime() + (endHours * 60 * 60 * 1000));
                          
                          // Calculate grid-aligned positions
                          const gridStartY = (startHours * 76) - (index * 76) + rect.top;
                          const gridEndY = (endHours * 76) - (index * 76) + rect.top;
                          
                          updatePreviewElement(gridStartY, gridEndY);
                        }
                      };
                      
                      const updatePreviewElement = (startY, endY) => {
                        if (!previewElement) return;
                        
                        // Get scroll positions
                        const scrollTop = window.scrollY || document.documentElement.scrollTop;
                        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
                        
                        const top = Math.min(startY, endY) - scrollTop;
                        const height = Math.abs(endY - startY);
                        
                        previewElement.style.top = `${top}px`;
                        previewElement.style.left = `${rect.left - scrollLeft + 1}px`;
                        previewElement.style.height = `${height}px`;
                        
                        // Update time display
                        const timeDisplay = previewElement.firstChild;
                        const startTimeStr = dragStartTime.toLocaleTimeString('en-US', { 
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'UTC'
                        });
                        const endTimeStr = dragEndTime.toLocaleTimeString('en-US', { 
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'UTC'
                        });
                        timeDisplay.textContent = `${startTimeStr} - ${endTimeStr}`;
                      };
                    
                      const handleMouseUp = async () => {
                        if (dragStarted) {
                          // Remove preview element
                          if (previewElement) {
                            previewElement.remove();
                          }
                    
                          try {
                            const finalStartTime = dragStartTime < dragEndTime ? dragStartTime : dragEndTime;
                            const finalEndTime = dragStartTime < dragEndTime ? dragEndTime : dragStartTime;
                    
                            const response = await fetch('https://serenidad.click/hacktime/createEventTask', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                token: localStorage.getItem('token'),
                                eventId: selectedEventId,
                                title: '',
                                description: '',
                                startTime: finalStartTime.toISOString(),
                                endTime: finalEndTime.toISOString(),
                                initialAssignee: assigneeEmail
                              }),
                            });
                    
                            if (!response.ok) {
                              const errorData = await response.json();
                              throw new Error(errorData.error || 'Failed to create task');
                            }
                    
                            const newTask = await response.json();
                            setSelectedEvent(prev => ({
                              ...prev,
                              tasks: [...(prev.tasks || []), newTask]
                            }));
                            setSelectedTask(newTask);
                            setSelectedTaskColumn(columnId);
                    
                          } catch (error) {
                            console.error('Failed to create task:', error);
                            alert('Failed to create task: ' + error.message);
                          }
                        }
                        
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                    
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
  style={{
    width: 217,
    height: 75,
    borderRight: "1px solid #EBEBEB",
    borderBottom: "1px solid #EBEBEB",
    flexShrink: 0
  }}
                    ></div>
                  ))}
                </div>

                {/* Team Member Columns */}
                {selectedEvent?.teamMembers?.map((teamMember) => (
                  <div 
                  data-column-id={teamMember.name}

                  key={teamMember.id} style={{display: "flex", flexDirection: "column", flexShrink: 0}}>
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
                    
                    {/* Add task mapping for team member */}
                    <div style={{position: "relative"}}>
                      {selectedEvent?.tasks
                        ?.filter(task => task.assignedTo.some(person => person.email === teamMember.email))
                        .map((task, index) => (
                          <TaskCard 
                            selectedTask={selectedTask}
                            key={index}
                            titleInputRef={titleInputRef}
                            selectedEvent={selectedEvent}
                            setSelectedEvent={setSelectedEvent}  // Add this prop
                            task={task}
                            dayStart={new Date(selectedEvent.startTime)}
                            setSelectedTask={setSelectedTask}
                            columnId={teamMember.name}
                            setSelectedTaskColumn={setSelectedTaskColumn}
                            selectedTaskColumn={selectedTaskColumn}
                            editingTaskTitle={editingTaskTitle}
                            setEditingTaskTitle={setEditingTaskTitle}
                            editingTaskDescription={editingTaskDescription}
                            setEditingTaskDescription={setEditingTaskDescription}
                            handleTaskUpdate={handleTaskUpdate}
                            handleDeleteTask={handleDeleteTask}  // Add this prop
                          />
                        ))}
                    </div>
                    
                    {Array.from({ length: hoursDiff }).map((_, index) => (
                      <div 
                      key={index} 
                      onMouseDown={(e) => {
                        const targetElement = e.currentTarget;
                        const rect = targetElement.getBoundingClientRect();
                        const initialY = e.clientY;
                        let dragStarted = false;
                        let previewElement = null;
                        
                        const columnElement = e.target.closest('[data-column-id]');
                        const columnId = columnElement ? columnElement.dataset.columnId : 'unknown';
                        
                        // Determine the assignee based on column
                        let assigneeEmail;
                        if (columnId === 'You') {
                          assigneeEmail = user.email;
                        } else {
                          const teamMember = selectedEvent?.teamMembers?.find(member => member.name === columnId);
                          assigneeEmail = teamMember?.email;
                        }
                        
                        if (!assigneeEmail) {
                          console.error('No valid assignee found for column:', columnId);
                          return;
                        }
                      
                        const initialMousePos = {
                          x: e.clientX,
                          y: e.clientY
                        };
                      
                        const startY = initialY - rect.top + (index * 76);
                        const hoursFromStart = Math.floor(startY / 76);
                        const startTime = new Date(selectedEvent.startTime);
                        let dragStartTime = new Date(startTime.getTime() + (hoursFromStart * 60 * 60 * 1000));
                        let dragEndTime = dragStartTime;
                      
                        // Create preview element function
                        const createPreviewElement = () => {
                          const preview = document.createElement('div');
                          preview.style.position = 'fixed'; // Changed from 'absolute' to 'fixed'
                          preview.style.width = '215px';
                          preview.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                          preview.style.border = '2px dashed rgb(37, 99, 235)';
                          preview.style.borderRadius = '6px';
                          preview.style.zIndex = '1000';
                          preview.style.pointerEvents = 'none';
                          
                          // Add time display
                          const timeDisplay = document.createElement('div');
                          timeDisplay.style.padding = '8px';
                          timeDisplay.style.fontSize = '12px';
                          timeDisplay.style.color = 'rgb(37, 99, 235)';
                          timeDisplay.style.fontWeight = 'bold';
                          preview.appendChild(timeDisplay);
                          
                          // Add "New Task" label
                          const label = document.createElement('div');
                          label.textContent = 'New Task';
                          label.style.padding = '8px';
                          label.style.fontSize = '14px';
                          label.style.color = 'rgb(37, 99, 235)';
                          preview.appendChild(label);
                          
                          document.body.appendChild(preview);
                          return preview;
                        };
                      
                        // Update preview element function
                        const handleMouseMove = (moveEvent) => {
                          const distance = Math.sqrt(
                            Math.pow(moveEvent.clientX - initialMousePos.x, 2) + 
                            Math.pow(moveEvent.clientY - initialMousePos.y, 2)
                          );
                        
                          if (!dragStarted && distance >= 5) {
                            dragStarted = true;
                            previewElement = createPreviewElement();
                          }
                        
                          if (dragStarted) {
                            // Calculate hours from start for both positions
                            const startHours = Math.floor((initialY - rect.top + (index * 76)) / 76);
                            const endHours = Math.ceil((moveEvent.clientY - rect.top + (index * 76)) / 76);
                            
                            // Update drag times
                            dragStartTime = new Date(startTime.getTime() + (startHours * 60 * 60 * 1000));
                            dragEndTime = new Date(startTime.getTime() + (endHours * 60 * 60 * 1000));
                            
                            // Calculate grid-aligned positions
                            const gridStartY = (startHours * 76) - (index * 76) + rect.top;
                            const gridEndY = (endHours * 76) - (index * 76) + rect.top;
                            
                            updatePreviewElement(gridStartY, gridEndY);
                          }
                        };
                        
                        const updatePreviewElement = (startY, endY) => {
                          if (!previewElement) return;
                          
                          // Get scroll positions
                          const scrollTop = window.scrollY || document.documentElement.scrollTop;
                          const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
                          
                          const top = Math.min(startY, endY) - scrollTop;
                          const height = Math.abs(endY - startY);
                          
                          previewElement.style.top = `${top}px`;
                          previewElement.style.left = `${rect.left - scrollLeft + 1}px`;
                          previewElement.style.height = `${height}px`;
                          
                          // Update time display
                          const timeDisplay = previewElement.firstChild;
                          const startTimeStr = dragStartTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'UTC'
                          });
                          const endTimeStr = dragEndTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'UTC'
                          });
                          timeDisplay.textContent = `${startTimeStr} - ${endTimeStr}`;
                        };
                        
                      
                        const handleMouseUp = async () => {
                          if (dragStarted) {
                            // Remove preview element
                            if (previewElement) {
                              previewElement.remove();
                            }
                      
                            try {
                              const finalStartTime = dragStartTime < dragEndTime ? dragStartTime : dragEndTime;
                              const finalEndTime = dragStartTime < dragEndTime ? dragEndTime : dragStartTime;
                      
                              const response = await fetch('https://serenidad.click/hacktime/createEventTask', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  token: localStorage.getItem('token'),
                                  eventId: selectedEventId,
                                  title: '',
                                  description: '',
                                  startTime: finalStartTime.toISOString(),
                                  endTime: finalEndTime.toISOString(),
                                  initialAssignee: assigneeEmail
                                }),
                              });
                      
                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Failed to create task');
                              }
                      
                              const newTask = await response.json();
                              setSelectedEvent(prev => ({
                                ...prev,
                                tasks: [...(prev.tasks || []), newTask]
                              }));
                              setSelectedTask(newTask);
                              setSelectedTaskColumn(columnId);
                      
                            } catch (error) {
                              console.error('Failed to create task:', error);
                              alert('Failed to create task: ' + error.message);
                            }
                          }
                          
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                      
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                      style={{
                        width: 217,
                        height: 75,
                        borderRight: "1px solid #EBEBEB",
                        borderBottom: "1px solid #EBEBEB",
                        flexShrink: 0
                      }}
                      ></div>
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
  )}