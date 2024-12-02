import React, { useState, useEffect, useRef } from 'react';
import CustomDateTimeSelect from './CustomDateTimeSelect'

const COLORS = [
    "2,147,212",
    "218,128,0",
    "8,164,42",
    "142,8,164",
    "190,58,44",
    "89,89,89"
  ];
  
// Add this mapping for tag-to-color
const TAG_COLORS = {
    "Activity": "8,164,42",    // Green
    "Deadline": "190,58,44",   // Red
    "Meal": "218,128,0",       // Orange
    "Workshop": "142,8,164",   // Purple
    // Add more mappings as needed
};

const DEFAULT_COLOR = "2,147,212"; // Blue
  
// Add this helper function at the top
const isWithinEventBounds = (newTime, eventStart, eventEnd) => {
  const newDate = new Date(newTime);
  const startDate = new Date(eventStart);
  const endDate = new Date(eventEnd);
  return newDate >= startDate && newDate <= endDate;
};
  
// Add this after the existing TAG_COLORS constant
const formatLocationName = (buildings, locationId) => {
  if (!locationId) return '';
  
  for (const building of buildings) {
    for (const room of building.rooms) {
      if (room.roomId === locationId) {
        return `${building.buildingName} - ${room.roomName}`;
      }
    }
  }
  return '';
};
  
export const EditCalendarEvent = ({ 
  selectedCalendarEvent, 
  handleDeleteConfirmation, 
  setSelectedCalendarEvent, 
  setSelectedEvent, 
  handleEventTitleUpdate, 
  formatTime, 
  timeStringToDateok, 
  handleTimeUpdate, 
  MAX_DURATION, 
  setLowerNav,
  selectedEventId, 
  selectedEvent, 
  handleColorUpdate, 
  animatingColor 
}) => {
  const [tagPulseActive, setTagPulseActive] = useState(false);
  
  const timeStringToDate = (timeString, baseDate) => {
    const [hours, minutes] = timeString.split(':');
    const newDate = new Date(baseDate);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return newDate;
  }; 
  
  const tryAutoTag = async (title) => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/autotag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          availableTags: selectedEvent?.availableTags || []
        }),
      });

      const data = await response.json();
      
      if (data.tag) {
        const autoColor = TAG_COLORS[data.tag] || DEFAULT_COLOR;
        
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
            title: title,
            color: autoColor,
            tag: data.tag
          }),
        });

        if (updateResponse.ok) {
          setSelectedCalendarEvent(prev => ({
            ...prev,
            title: title,
            tag: data.tag,
            color: autoColor
          }));
          setLowerNav(true)
          setSelectedEvent(prev => ({
            ...prev,
            calendar_events: prev.calendar_events.map(evt => 
              evt.id === selectedCalendarEvent.id 
                ? { ...evt, title: title, tag: data.tag, color: autoColor }
                : evt
            )
          }));

          setTagPulseActive(true);
          setTimeout(() => setTagPulseActive(false), 750);
        }
      }
    } catch (error) {
      console.error('Auto-tag error:', error);
    }
  };
  
    return <div style={{ position: "absolute", cursor: "auto", left: 200, borderRadius: 8, width: 400, backgroundColor: "#fff" }}>
      <div style={{ width: "calc(100% - 24px)", borderRadius: "16px 16px 0px 0px", paddingTop: 8, paddingBottom: 8, justifyContent: "space-between", paddingLeft: 16, paddingRight: 8, alignItems: "center", display: "flex", backgroundColor: "#F6F8FA" }}>
        <p
          onClick={() => console.log(new Date(selectedCalendarEvent.endTime))}
          style={{ margin: 0, fontSize: 14 }}>Edit Calendar Event</p>
        <img
          onClick={() => handleDeleteConfirmation(selectedCalendarEvent.id)}
          style={{ width: 24, height: 24, cursor: "pointer" }}
          src="/icons/trash.svg" />
      </div>
      <div style={{ display: "flex", gap: 16, padding: 16, flexDirection: "column" }}>
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
          } }
          contentEditable
          suppressContentEditableWarning
          onBlur={async (e) => {
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
                  evt.id === selectedCalendarEvent.id 
                    ? { ...evt, title: newTitle } 
                    : evt
                )
              }));

              // Make both calls in parallel
              await Promise.all([
                handleEventTitleUpdate(selectedCalendarEvent.id, newTitle),
                // Try to auto-tag if no tag is currently set
                !selectedCalendarEvent.tag ? tryAutoTag(newTitle) : Promise.resolve()
              ]);
            }
          } }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.target.blur(); // This will trigger the onBlur event
            }
          } }
          style={{
            margin: 0,
            fontSize: 24,
            cursor: "text",
            color: "#000",
            outline: "none",
            width: "calc(100% - 10px)",
            border: "1px solid rgb(235, 235, 235)",
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* <img src="./icons/clock.svg" style={{ width: 24, height: 24 }} /> */}
          <div style={{width: "100%", padding: 8, gap: 0, border: "1px solid #EBEBEB", borderRadius: 4, backgroundColor: "rgba(0, 0, 0, 0.00)", display: "flex", flexDirection: "row"}}>
            <div style={{display: "flex", alignItems: "center", flexDirection: "column", marginTop: 4, marginRight: 8,}}>
              <div style={{height: 8, marginTop: 8, width: 8, backgroundColor: "rgba(0, 0, 0, 0.5)", borderRadius: 4}}></div>
              <div style={{height: 28, marginTop: 1, marginBottom: 1, width: 0.1, borderLeft: "0.5px dashed rgba(0, 0, 0, 0.5)", borderRight: "0.5px dashed rgba(0, 0, 0, 0.5)", borderImage: "repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0, rgba(0, 0, 0, 0.5) 4px, transparent 4px, transparent 8px) 1"}}></div>
              <div style={{height: 6, border: "1px solid rgba(0, 0, 0, 0.5)", width: 6, backgroundColor: "rgba(0, 0, 0, 0.0)", borderRadius: 4}}></div>
            </div>
            <div style={{flexDirection: "column", width: "100%", gap: 8, display: "flex"}}>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexDirection: "row"}}>
                <p style={{margin: 0, fontSize: 16, paddingTop: 0, paddingBottom: 0, fontSize: 16, lineHeight: 1}}>Start</p>
                <div style={{display: 'flex', flexDirection: "row", gap: 4}}>
                  <CustomDateTimeSelect
                    value={new Date(selectedCalendarEvent.startTime)}
                    onChange={async (date) => {
                      const newStartTime = new Date(selectedCalendarEvent.startTime);
                      newStartTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      const duration = new Date(selectedCalendarEvent.endTime) - new Date(selectedCalendarEvent.startTime);
                      const newEndTime = new Date(newStartTime.getTime() + duration);
                      await handleTimeUpdate(selectedCalendarEvent.id, newStartTime, newEndTime);
                    }}
                    type="date"
                  />
                  <CustomDateTimeSelect
                    value={new Date(selectedCalendarEvent.startTime)}
                    onChange={async (timeString) => {
                      const newStartTime = new Date(selectedCalendarEvent.startTime);
                      newStartTime.setUTCHours(timeString.getUTCHours(), timeString.getUTCMinutes(), 0, 0);
                      
                      // Check if new time is within event bounds
                      if (!isWithinEventBounds(newStartTime, selectedEvent.startTime, selectedEvent.endTime)) {
                        alert("Not altering time because it goes out of time bounds of event");
                        return;
                      }
                      
                      // Check if new start time would be after end time
                      const endTime = new Date(selectedCalendarEvent.endTime);
                      if (newStartTime >= endTime) {
                        // If so, set end time to start time + 1 hour
                        const newEndTime = new Date(newStartTime);
                        newEndTime.setHours(newEndTime.getHours() + 1);
                        
                        // Check if new end time is within bounds
                        if (!isWithinEventBounds(newEndTime, selectedEvent.startTime, selectedEvent.endTime)) {
                          alert("Not altering time because it goes out of time bounds of event");
                          return;
                        }
                        
                        await handleTimeUpdate(selectedCalendarEvent.id, newStartTime, newEndTime);
                      } else {
                        await handleTimeUpdate(selectedCalendarEvent.id, newStartTime, endTime);
                      }
                    }}
                    type="time"
                  />
                </div>
              </div>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexDirection: "row"}}>
                <p style={{margin: 0, fontSize: 16, paddingTop: 0, paddingBottom: 0, fontSize: 16, lineHeight: 1}}>End</p>
                <div style={{display: 'flex', flexDirection: "row", gap: 4}}>
                  <CustomDateTimeSelect
                    value={new Date(selectedCalendarEvent.endTime)}
                    onChange={async (date) => {
                      const newEndTime = new Date(selectedCalendarEvent.endTime);
                      newEndTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      await handleTimeUpdate(selectedCalendarEvent.id, new Date(selectedCalendarEvent.startTime), newEndTime);
                    }}
                    type="date"
                  />
                  <CustomDateTimeSelect
                    value={new Date(selectedCalendarEvent.endTime)}
                    onChange={async (timeString) => {
                      const startTime = new Date(selectedCalendarEvent.startTime);
                      const newEndTime = new Date(selectedCalendarEvent.endTime);
                      newEndTime.setUTCHours(timeString.getUTCHours(), timeString.getUTCMinutes(), 0, 0);

                      // Check if new time is within event bounds
                      if (!isWithinEventBounds(newEndTime, selectedEvent.startTime, selectedEvent.endTime)) {
                        alert("Not altering time because it goes out of time bounds of event");
                        return;
                      }

                      if (newEndTime < startTime) {
                        const nextDayEndTime = new Date(newEndTime.getTime() + 24 * 60 * 60 * 1000);
                        const duration = nextDayEndTime - startTime;

                        if (duration <= MAX_DURATION) {
                          newEndTime.setTime(nextDayEndTime.getTime());
                          // Check if next day time is within bounds
                          if (!isWithinEventBounds(newEndTime, selectedEvent.startTime, selectedEvent.endTime)) {
                            alert("Not altering time because it goes out of time bounds of event");
                            return;
                          }
                        } else {
                          return;
                        }
                      }

                      await handleTimeUpdate(selectedCalendarEvent.id, startTime, newEndTime);
                    }}
                    type="time"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedEvent?.buildings?.length > 0 && (
          <div style={{
            padding: 8, 
            gap: 8, 
            border: "1px solid #EBEBEB", 
            borderRadius: 4, 
            backgroundColor: "rgba(0, 0, 0, 0.00)", 
            display: "flex", 
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <select
              value={selectedCalendarEvent.location || ""}
              onChange={async (e) => {
                const locationId = e.target.value || null;
                
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
                      tag: selectedCalendarEvent.tag,
                      location: locationId
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to update location');
                  }

                  // Update local state
                  setSelectedCalendarEvent(prev => ({
                    ...prev,
                    location: locationId
                  }));

                  setSelectedEvent(prev => ({
                    ...prev,
                    calendar_events: prev.calendar_events.map(evt => 
                      evt.id === selectedCalendarEvent.id 
                        ? { ...evt, location: locationId }
                        : evt
                    )
                  }));

                } catch (error) {
                  console.error('Failed to update location:', error);
                  alert(error.message);
                }
              }}
              style={{
                padding: "4px 8px",
                backgroundColor: "#fff",
                outline: "1px solid rgb(235, 235, 235)",
                borderRadius: 4,
                fontSize: 16,
                border: "none",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: "url('./icons/chevron-down.svg')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "16px",
                paddingRight: "28px",
                flex: "1"
              }}
            >
              <option value="">Select Location</option>
              {selectedEvent.buildings.map((building) => (
                <optgroup key={building.buildingId} label={building.buildingName}>
                  {building.rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.roomName}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* <img src="./icons/label.svg" style={{ width: 24, height: 24 }} /> */}
          <div style={{width: "100%", padding: 8, gap: 8, border: "1px solid #EBEBEB", borderRadius: 4, backgroundColor: "rgba(0, 0, 0, 0.00)", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between"}}>
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
                      calendar_events: prev.calendar_events.map(evt => evt.id === selectedCalendarEvent.id
                        ? { ...evt, tag: newLabel }
                        : evt
                      )
                    }));
    
                  } catch (error) {
                    console.error('Failed to update tag:', error);
                    alert(error.message);
                  }
                }
              } }
              style={{
                padding: "4px 8px",
                backgroundColor: "#fff",
                outline: tagPulseActive ? "1px solid rgba(142, 8, 164, 0.6)" : "1px solid rgb(235, 235, 235)",
                borderRadius: 4,
                fontSize: 16,
                border: "none",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: "url('./icons/chevron-down.svg')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "16px",
                paddingRight: "28px",
                flex: "1",
                transition: "outline 0.25s ease"
              }}
            >
              <option value="Untagged">Select Tag</option>
              {selectedEvent?.availableTags?.map((tag, index) => (
                <option key={index} value={tag}>
                  {tag}
                </option>
              ))}
              <option value="New Tag">+ New Tag</option>
            </select>

            <div style={{ display: "flex", height: 28, alignItems: "center", flexDirection: "row", gap: 8 }}>
              {COLORS.map((colorString, index) => (
                <div
                  key={index}
                  onClick={() => handleColorUpdate(selectedCalendarEvent.id, colorString)}
                  style={{
                    background: (selectedCalendarEvent.color === colorString || animatingColor === colorString) 
                      ? `linear-gradient(to bottom, 
                          rgba(${colorString}, 0.6) 0%,
                          rgba(${colorString}, 1) 50%,
                          rgba(${colorString}, 0.4) 100%)`
                      : `linear-gradient(to bottom, 
                          rgba(${colorString}, 0.9) 0%,
                          rgba(${colorString}, 1.0) 50%,
                          rgba(${colorString}, 0.9) 100%)`,
                    cursor: "pointer",
                    borderRadius: "100%",
                    height: selectedCalendarEvent.color === colorString || animatingColor === colorString ? 28 : 24,
                    width: selectedCalendarEvent.color === colorString || animatingColor === colorString ? 28 : 24,
                    opacity: selectedCalendarEvent.color === colorString || animatingColor === colorString ? 1 : 0.5,
                    transition: "all 0.2s ease, background 0.2s ease"
                  }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>;
  }



