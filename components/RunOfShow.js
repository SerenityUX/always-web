import React, { useState, useEffect, useRef } from 'react';
import { TaskCard } from './TaskCard';

const COLORS = [
    "2,147,212",
    "218,128,0",
    "8,164,42",
    "142,8,164",
    "190,58,44",
    "89,89,89"
  ];

const EVENT_WIDTH = 140; // Base width of an event
const EVENT_OVERLAP_OFFSET = 20; // Horizontal offset for overlapping events

export const RunOfShow = ({
  selectedEvent,
  user,
  MAX_DURATION,
  isTimeOverlapping,
  selectedEventId,
  setNewEventId,
  handleDeleteCalendarEvent,
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
  handleColorUpdate,
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

  const [scrollNumber, setScrollNumber] = useState(75);
  const [scrollLeft, setScrollLeft] = useState(0);

  const eventScheduleRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const handleSliderDrag = (e) => {
    const slider = e.currentTarget;
    const rect = slider.getBoundingClientRect();
    const startX = rect.left;
    const width = rect.width;
    
    const updateScrollNumber = (clientX) => {
      const position = Math.max(0, Math.min(1, (clientX - startX) / width));
      const value = Math.round(64 + position * (150 - 64));
      setScrollNumber(value);
    };

    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      updateScrollNumber(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

    
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

  // Add wheel event handler to prevent default zoom and control scrollNumber
  useEffect(() => {
    const handleWheel = (e) => {
      // Check if it's a pinch-to-zoom gesture (ctrlKey is true for pinch gestures on Mac)
      if (e.ctrlKey) {
        e.preventDefault();
        
        // Make delta more sensitive (5x) and exponential
        const delta = -e.deltaY * 10;
        const exponentialFactor = Math.sign(delta) * Math.pow(Math.abs(delta) / 10, 1.5);
        
        setScrollNumber(prevNumber => {
          const newValue = Math.min(310, Math.max(75, prevNumber + exponentialFactor));
          return Math.round(newValue);
        });
      }
    };

    // Add the event listener with passive: false to allow preventDefault
    document.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []); // Empty dependency array since we don't need to re-add the listener

  useEffect(() => {
    const handleScroll = (e) => {
      if (!eventScheduleRef.current || !scrollContainerRef.current) return;

      if (e.target === scrollContainerRef.current) {
        // Main container is scrolling, update Event Schedule
        eventScheduleRef.current.scrollTop = e.target.scrollTop;
        setScrollLeft(e.target.scrollLeft);
      } else if (e.target === eventScheduleRef.current) {
        // Event Schedule is scrolling, update main container
        scrollContainerRef.current.scrollTop = e.target.scrollTop;
      }
    };

    const eventSchedule = eventScheduleRef.current;
    const scrollContainer = scrollContainerRef.current;

    if (eventSchedule && scrollContainer) {
      eventSchedule.addEventListener('scroll', handleScroll);
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (eventSchedule && scrollContainer) {
        eventSchedule.removeEventListener('scroll', handleScroll);
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []); // Empty dependency array since we don't need to re-add the listeners

  return (
    <div style={{
        flex: 1,
        overflowY: "scroll",
        display: "flex",
        color: "#59636E",
        position: "relative",
        height: "calc(100vh - 98px)",  // Changed from overflowY: "scroll"
        overflow: "hidden" // Ensure parent doesn't scroll
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

            
            <div className="zoom-slider" style={{
              position: "fixed", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              paddingLeft: 12, 
              paddingRight: 12, 
              bottom: 16, 
              right: 16, 
              width: 75, 
              zIndex: 3, 
              height: 30, 
              borderRadius: 12, 
              border: "1px solid #EBEBEB", 
              backgroundColor: "#747474"
            }}>
              <div style={{
                position: "relative",
                width: "100%",
                height: 20,
                display: "flex",
                alignItems: "center",
                gap: 4
              }}>
                <img style={{height: 12, width: 12, userSelect: 'none', pointerEvents: "none"}} src="/icons/magnify.svg"/>
                <style>
  {`
    .zoom-range {
      width: 100%;
      -webkit-appearance: none;
      background: transparent;
    }
    .zoom-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: ${12 + (scrollNumber - 75) * 0.017}px;
      width: ${12 + (scrollNumber - 75) * 0.017}px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      margin-top: ${-((12 + (scrollNumber - 75) * 0.017) / 2) + 1}px;
      box-shadow: ${
        scrollNumber > 200 
          ? `0 1px 3px rgba(100, 100, 100, ${Math.min((scrollNumber - 200) / 110, 0.15)})`
          : 'none'
      };
      transition: box-shadow 0.2s ease;
    }
    .zoom-range::-webkit-slider-runnable-track {
      width: 100%;
      height: 2px;
      background: #ffffff40;
      border-radius: 1px;
    }
    .zoom-range::-moz-range-thumb {
      height: ${12 + (scrollNumber - 75) * 0.017}px;
      width: ${12 + (scrollNumber - 75) * 0.017}px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      border: none;
      box-shadow: ${
        scrollNumber > 200 
          ? `0 1px 3px rgba(100, 100, 100, ${Math.min((scrollNumber - 200) / 110, 0.15)})`
          : 'none'
      };
      transition: box-shadow 0.2s ease;
    }
    .zoom-range::-moz-range-track {
      width: 100%;
      height: 2px;
      background: #ffffff40;
      border-radius: 1px;
    }
  `}
</style>
  <input
    type="range"
    className="zoom-range"
    min="75"
    max="310"
    value={scrollNumber}
    onChange={(e) => {
      setScrollNumber(parseInt(e.target.value))
      console.log(parseInt(e.target.value))
    }}
  />
              </div>
            </div>
              {/* Fixed Event Schedule Column */}

              <div style={{
                display: "flex",
                // overflowX: "auto",
                height: "100%",
                // overflowY: "scroll", // Enable both horizontal and vertical scrolling
                width: "100%",
                overflowX: (selectedCalendarEvent != null) ? ("visible") : ("hidden"), // Hide overflow
                overflowY: "scroll"
              }}>
              <div 

              ref={eventScheduleRef}
              data-column-id="Event Schedule"
              style={{
                display: "flex", 
                overflowY: "scroll",
                width: (selectedCalendarEvent != null) ? ("640px") : ("220px"),
                height: "100%",
                flexDirection: "column", 
                flexShrink: 0,
                position: "sticky",
                left: 0,
                zIndex: 1,
                msOverflowStyle: "none",  /* IE and Edge */
                scrollbarWidth: "none",   /* Firefox */
                "&::-webkit-scrollbar": { /* Chrome, Safari and Opera */
                  display: "none"
                }
              }}>

                <p style={{
                  margin: 0, 
                  backgroundColor: "#fff",
                  width: 185,
                  marginLeft: 32,
                  zIndex: 5,
                  borderRight: "1px solid #EBEBEB", 
                  borderBottom: "1px solid #EBEBEB", 
                  paddingTop: 6, 
                  position: "sticky",
                  top: 0,
                  paddingBottom: 8
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
                      const hoursFromStart = Math.floor(startY / (scrollNumber + 1));
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
                        
                        const topPos = startHours * (scrollNumber + 1);
                        const height = (endHours - startHours) * (scrollNumber + 1);
                        
                        preview.style.top = `${topPos}px`;
                        preview.style.height = `${height}px`;
                      };

                      updatePreview(dragStartTime, dragEndTime);
                      dragStarted = true;

                      // Replace the initial mousemove handler with the drag handler
                      document.removeEventListener('mousemove', handleMouseMove);
                      
                      const handleDragMove = (moveEvent) => {
                        const endY = moveEvent.clientY - rect.top;
                        const endHoursFromStart = Math.ceil(endY / (scrollNumber + 1));
                        dragEndTime = new Date(startTime.getTime() + (endHoursFromStart * 60 * 60 * 1000));
                        updatePreview(dragStartTime, dragEndTime);
                      };

                      document.addEventListener('mousemove', handleDragMove);

                      const handleMouseUp = async () => {
                        if (dragStarted) {
                          // Remove preview element
                          if (preview.parentNode) {
                            preview.remove();
                          }
                    
                          try {
                            const finalStartTime = dragStartTime < dragEndTime ? dragStartTime : dragEndTime;
                            const finalEndTime = dragStartTime < dragEndTime ? dragEndTime : dragStartTime;
                    
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
                            
                            // Update the events list
                            setSelectedEvent(prev => ({
                              ...prev,
                              calendar_events: [...(prev.calendar_events || []), {
                                ...newEvent,
                                startTime: newEvent.start_time,
                                endTime: newEvent.end_time
                              }]
                            }));

                            // Set the newly created event as the selected event
                            setSelectedCalendarEvent({
                              ...newEvent,
                              startTime: newEvent.start_time,
                              endTime: newEvent.end_time
                            });

                          } catch (error) {
                            console.error('Failed to create calendar event:', error);
                          }
                        }
                        
                        document.removeEventListener('mousemove', handleDragMove);
                        document.removeEventListener('mouseup', handleMouseUp);
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
                      
                      // Calculate dimensions
                      const topOffset = ((eventStart - dayStart) / (1000 * 60 * 60)) * (scrollNumber + 1);
                      const duration = (eventEnd - eventStart) / (1000 * 60 * 60);
                      const height = Math.max(duration * (scrollNumber + 1), 18);
                      const isShortEvent = ((duration < 1 && scrollNumber <= 150) || (duration <= 0.25 && scrollNumber >= 150)) && !(scrollNumber >= 300);
                      const isOneHourEvent = (duration === 1 && scrollNumber < 120) && !(scrollNumber >= 300)

                      // Find overlapping events
                      const overlappingEvents = selectedEvent.calendar_events.filter(otherEvent => {
                        if (otherEvent.id === event.id) return false;
                        const otherStart = new Date(otherEvent.startTime);
                        const otherEnd = new Date(otherEvent.endTime);
                        return isTimeOverlapping(eventStart, eventEnd, otherStart, otherEnd);
                      });

                      // Calculate offset and width based on overlapping events
                      const overlapIndex = overlappingEvents.filter(e => e.id < event.id).length;
                      const totalOverlaps = overlappingEvents.length;
                      const horizontalOffset = overlapIndex * EVENT_OVERLAP_OFFSET;
                      const adjustedWidth = EVENT_WIDTH - (totalOverlaps * EVENT_OVERLAP_OFFSET);

                      const backgroundColor = event.color ? 
                        `rgb(${event.color})` : 
                        "#DA8000";
                      
                      return (
                        <div key={index} style={{
                          position: "absolute",
                          top: topOffset,
                          display: "flex",
                          cursor: "pointer",
                          width: 201,
                          height: `calc(${height}px - 16px)`,
                          zIndex: 2,
                          marginLeft: 32,
                          padding: 8
                        }}>
                          <div 
                            onClick={() => {
                              setSelectedCalendarEvent(event);
                              console.log("Selected Calendar Event:", event);
                            }}
                            style={{
                              backgroundColor,
                              borderRadius: 8,
                              display: "flex",
                              flexDirection: isShortEvent ? "row" : "column",
                              justifyContent: isOneHourEvent ? "center" : "space-between",
                              alignItems: (isShortEvent) ? "center" : "stretch",
                              gap: isShortEvent ? "8px" : undefined,
                              padding: 12,
                              width: adjustedWidth,
                              marginLeft: horizontalOffset,
                              userSelect: "none",
                              cursor: "pointer",
                              height: isOneHourEvent ? "auto" : undefined,
                              zIndex: overlapIndex + 2 // Ensure proper stacking of overlapping events
                            }}>
                            <p
                              ref={el => {
                                if (el && event.id === newEventId) {
                                  el.focus();
                                  setNewEventId(null);
                                }
                              }}
                              // contentEditable
                              // suppressContentEditableWarning
                              // onClick={(e) => {
                              //   e.stopPropagation();
                              // }}
                              onBlur={(e) => {
                                const newTitle = e.target.innerText.trim();
                                if (newTitle === '' && event.title === '') {
                                  handleDeleteCalendarEvent(event.id);
                                } else if (newTitle !== event.title) {
                                  handleEventTitleUpdate(event.id, newTitle);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.target.blur();
                                } else if (e.key === 'Escape') {
                                  if (event.title === '' && e.target.innerText.trim() === '') {
                                    handleDeleteCalendarEvent(event.id);
                                  } else {
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
                                padding: 0,
                                borderRadius: "4px",
                                transition: "background-color 0.2s",
                                textOverflow: isShortEvent ? "ellipsis" : "unset",
                                overflow: isShortEvent ? "hidden" : "visible",
                                whiteSpace: isShortEvent ? "nowrap" : "pre-wrap",
                                minHeight: isShortEvent ? "auto" : "24px",
                                flex: isShortEvent ? "1" : undefined
                              }}
                            >
                              {event.title}
                            </p>
                            {!isShortEvent && <p style={{
                              margin: 0,
                              fontSize: isShortEvent ? 10 : 14,
                              color: "#fff",
                              
                              opacity: 0.8,
                              whiteSpace: "nowrap",
                              flexShrink: 0
                            }}>
                              {formatTime(eventStart)} - {formatTime(eventEnd)}
                            </p>}
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
                      top: ((new Date(selectedCalendarEvent.startTime) - new Date(selectedEvent.startTime)) / (1000 * 60 * 60)) * (scrollNumber + 1)
                    }}>
                      {(() => {
                        const previewDuration = (new Date(selectedCalendarEvent.endTime) - new Date(selectedCalendarEvent.startTime)) / (1000 * 60 * 60);
                        return (
                          <div style={{marginLeft: 24, position: "relative", marginTop: 0, padding: 8, height: previewDuration * (scrollNumber + 1) - 48}}>
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
                                  ref={el => {
                                    // Only auto focus when modal first opens
                                    if (el && selectedCalendarEvent.title === '') {
                                      el.focus();
                                      const range = document.createRange();
                                      range.selectNodeContents(el);
                                      const selection = window.getSelection();
                                      selection.removeAllRanges();
                                      selection.addRange(range);
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
                                      e.target.blur(); // This will trigger the onBlur event
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
        // Handle regular tag selection (existing code)
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

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to update label');
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
                                justifyContent: previewDuration <= 1 ? "center" : "space-between",
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
                        );
                      })()}
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
                        height: scrollNumber,
                        borderRight: "1px solid #EBEBEB",
                        borderBottom: "1px solid #EBEBEB",
                        flexShrink: 0,
                        position: "relative",
                        "&:hover::before": {
                          content: '"+',
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          color: "#00000022",
                          fontSize: "24px",
                          pointerEvents: "none"
                        }
                      }}>
                        <p style={{
                          position: "absolute",
                          fontSize: 9,
                          paddingLeft: 5,
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
                        {/* Add hover indicator */}
                        <div style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#00000000",
                          fontSize: selectedEvent?.calendar_events?.length > 0 ? "24px" : "14px",
                          transition: "color 0.2s ease",
                          userSelect: "none",
                          cursor: "pointer",
                          "&:hover": {
                            color: "#00000022"
                          }
                        }}
                        className="calendar-cell-hover"
                        >
                          {selectedEvent?.calendar_events?.length > 0 ? "+" : "Drag New Activity"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div 
                ref={scrollContainerRef}
                className="scroll-container" 
                style={{
                  display: "flex", 
                  flexDirection: "column", 
                  overflowX: "scroll",
                  marginLeft: selectedCalendarEvent == null ? (0) : (-420)
                }}>
                <div style={{
                  display: 'flex', 
                  position: "sticky",  // Change from fixed to sticky
                  top: 0,             // Required for sticky positioning
                  flexDirection: "row",
                  height: "fit-content", 
                  width: "fit-content",
                  backgroundColor: "#fff",
                  zIndex: (selectedCalendarEvent != null || selectedTask != null) ? 0 : 2
                  // Remove the transform property
                }}>
                              {!selectedEvent.notMemberOrOwner && (

                  <p style={{
                    margin: 0, 
                    height: 22, 
                    width: 201,
                    borderRight: "1px solid #EBEBEB", 
                    borderBottom: "1px solid #EBEBEB", 
                    paddingLeft: 16, 
                    paddingTop: 6, 
                    paddingBottom: 5,
                  }}>You</p>
                              )}
                  {selectedEvent?.teamMembers?.map((teamMember) => (
                    <p style={{
                      margin: 0, 
                      height: 22, 
                      width: 201,
                      borderRight: "1px solid #EBEBEB",
                      borderBottom: "1px solid #EBEBEB",
                      paddingLeft: 16,
                      backgroundColor: "#fff",
                      paddingTop: 6,
                      paddingBottom: 5
                    }}>{teamMember.name}</p>
                  ))}

                                 <p 
                                                 onClick={() =>
                                                  {console.log("Invite new member")
                                                  setIsInvitingNewUser(true)}
                                                }
                                 style={{
                    margin: 0, 
                    height: 22, 
                    cursor: "pointer",
                    width: 201,
                    borderRight: "1px solid #EBEBEB", 
                    borderBottom: "1px solid #EBEBEB", 
                    paddingLeft: 16, 
                    paddingTop: 6, 
                    paddingBottom: 5,
                    color: "#0969DA"
                  }}>+ Add</p>



                </div>
                <div 
                style={{
                  display: "flex",
                  height: "fit-content",
                  width: "fit-content",
                  flexDirection: "column",
                  flexShrink: 0,
                  overflowX: "scroll",
                  overflowY: "hidden"
                }}>


                  {/* Scrollable section */}
                  <div style={{
                    display: "flex",
                    width: "fit-content",
                    minWidth: "calc(100vw - 218px)",
                    flexShrink: 0,
                    overflowX: "hidden",
                    position: "relative",
                    overflowY: "hidden"
                  }}>
                    {/* You Column */}
                    {!selectedEvent.notMemberOrOwner && (
                    <div 
                    data-column-id="You"
                    style={{display: "flex", position: "relative", flexDirection: "column"}}>
                      {/* <p style={{
                        margin: 0, 
                        position: "sticky",
                        top: 0,
                        height: 22, 
                        width: 201,
                        borderRight: "1px solid #EBEBEB", 
                        borderBottom: "1px solid #EBEBEB", 
                        paddingLeft: 16, 
                        paddingTop: 6, 
                        paddingBottom: 5
                      }}>You</p> */}

                      {/* Add task mapping for current user */}
                      <div style={{position: "relative",

              height: "fit-content",

                  }}>
                        {selectedEvent?.tasks
                          ?.filter(task => task?.assignedTo?.some(person => person.email === user.email))
                          .map((task, index) => (
                            <TaskCard 
                              scrollNumber={parseInt(scrollNumber)}
                              key={index}
                              task={task}
                              user={user}
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
                      className="task-cell"
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
                      
                        const startY = initialY - rect.top + (index * (scrollNumber + 1));
                        const hoursFromStart = Math.floor(startY / (scrollNumber + 1));
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
                            const startHours = Math.floor((initialY - rect.top + (index * (scrollNumber + 1))) / (scrollNumber + 1));
                            const endHours = Math.ceil((moveEvent.clientY - rect.top + (index * (scrollNumber + 1))) / (scrollNumber + 1));
                            
                            // Update drag times
                            dragStartTime = new Date(startTime.getTime() + (startHours * 60 * 60 * 1000));
                            dragEndTime = new Date(startTime.getTime() + (endHours * 60 * 60 * 1000));
                            
                            // Calculate grid-aligned positions
                            const gridStartY = (startHours * (scrollNumber + 1)) - (index * (scrollNumber + 1)) + rect.top;
                            const gridEndY = (endHours * (scrollNumber + 1)) - (index * (scrollNumber + 1)) + rect.top;
                            
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
                        height: scrollNumber,
                        borderRight: "1px solid #EBEBEB",
                        borderBottom: "1px solid #EBEBEB",
                        flexShrink: 0,
                        cursor: "pointer"
                      }}
                    ></div>
                  ))}
                </div>)}


                {/* Team Member Columns */}
                {selectedEvent?.teamMembers?.map((teamMember) => (

                  <div 
                  data-column-id={teamMember.name}

                  key={teamMember.id} style={{display: "flex", flexDirection: "column", flexShrink: 0}}>
{/*                     
                    <p style={{
                      margin: 0, 
                      height: 22, 
                      width: 201,
                      borderRight: "1px solid #EBEBEB",
                      borderBottom: "1px solid #EBEBEB",
                      paddingLeft: 16,
                      backgroudColor: "#fff",
                      paddingTop: 6,
                      paddingBottom: 5
                    }}>{teamMember.name}</p> */}
                    
                    {/* Add task mapping for team member */}
                    <div style={{position: "relative"}}>
                      {selectedEvent?.tasks
                        ?.filter(task => task?.assignedTo?.some(person => person.email === teamMember.email))
                        .map((task, index) => (
                          
                          <TaskCard 
                            scrollNumber={parseInt(scrollNumber)}
                            key={index}
                            user={user}
                            task={task}
                            selectedTask={selectedTask}
                            titleInputRef={titleInputRef}
                            selectedEvent={selectedEvent}
                            setSelectedEvent={setSelectedEvent}  // Add this prop
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
                      className="task-cell"
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
                      
                        const startY = initialY - rect.top + (index * (scrollNumber + 1));
                        const hoursFromStart = Math.floor(startY / (scrollNumber + 1));
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
                            const startHours = Math.floor((initialY - rect.top + (index * (scrollNumber + 1))) / (scrollNumber + 1));
                            const endHours = Math.ceil((moveEvent.clientY - rect.top + (index * (scrollNumber + 1))) / (scrollNumber + 1));
                            
                            // Update drag times
                            dragStartTime = new Date(startTime.getTime() + (startHours * 60 * 60 * 1000));
                            dragEndTime = new Date(startTime.getTime() + (endHours * 60 * 60 * 1000));
                            
                            // Calculate grid-aligned positions
                            const gridStartY = (startHours * (scrollNumber + 1)) - (index * (scrollNumber + 1)) + rect.top;
                            const gridEndY = (endHours * (scrollNumber + 1)) - (index * (scrollNumber + 1)) + rect.top;
                            
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
                        height: scrollNumber,
                        borderRight: "1px solid #EBEBEB",
                        borderBottom: "1px solid #EBEBEB",
                        flexShrink: 0,
                        cursor: "pointer"

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

                  {Array.from({ length: hoursDiff }).map((_, index) => (
                    <div key={index} style={{
                      width: 217,
                      height: scrollNumber,
                      borderRight: "1px solid #EBEBEB",
                      borderBottom: "1px solid #EBEBEB",
                      flexShrink: 0
                    }}></div>
                    
                  ))}
                </div>
              </div>
              </div>
              </div>
              </div>
            </>
          );
        })()}
      </div>       
  )}