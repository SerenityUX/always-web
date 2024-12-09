import React, { useRef, useEffect, useState } from 'react';

const getEventStyles = (isPreview, backgroundColor, isShortEvent, isOneHourEvent) => ({
  backgroundColor,
  borderRadius: 8,
  display: "flex",
  flexDirection: isShortEvent ? "row" : "column",
  justifyContent: isOneHourEvent ? "auto" : "space-between",
  alignItems: isShortEvent ? "center" : "stretch",
  gap: isShortEvent ? 8 : undefined,
  padding: 12,
  width: 140,
  height: isOneHourEvent ? "auto" : isPreview ? "calc(100% + 8px)" : undefined,
  userSelect: "none",
  cursor: "pointer",
  position: "relative"
});

export const CalendarEvent = ({
  event,
  dayStart,
  scrollNumber,
  handleEventTitleUpdate,
  handleDeleteCalendarEvent,
  setSelectedCalendarEvent,
  formatTime,
  newEventId,
  setNewEventId,
  setLowerNav,
  isPreview = false
}) => {
  const titleRef = useRef(null);
  const containerRef = useRef(null);
  const [showTime, setShowTime] = useState(true);
  const [useEllipsis, setUseEllipsis] = useState(false);
  const [maxLines, setMaxLines] = useState(3);

  const eventStart = new Date(event.startTime);
  const eventEnd = new Date(event.endTime);
  
  const topOffset = ((eventStart - dayStart) / (1000 * 60 * 60)) * (scrollNumber + 1);
  const duration = (eventEnd - eventStart) / (1000 * 60 * 60);
  const height = Math.max(duration * (scrollNumber + 1), 18);
  
  const isShortEvent = ((duration < 1 && scrollNumber <= 150) || (duration <= 0.25 && scrollNumber >= 150)) && !(scrollNumber >= 300);
  const isOneHourEvent = (duration === 1 && scrollNumber < 120) && !(scrollNumber >= 300);
  const backgroundColor = event.color ? `rgb(${event.color})` : "#DA8000";

  // Dynamic layout calculation
  useEffect(() => {
    if (titleRef.current && containerRef.current && !isShortEvent) {
      const observer = new ResizeObserver(() => {
        const containerHeight = containerRef.current.clientHeight;
        const titleElement = titleRef.current;
        const lineHeight = parseInt(window.getComputedStyle(titleElement).lineHeight);
        const timeHeight = 24; // Height needed for time display
        
        // Force single line if container is too small for comfortable wrapping
        const shouldUseEllipsis = containerHeight < (lineHeight * 2.5); // Increased threshold
        setUseEllipsis(shouldUseEllipsis);
        
        if (shouldUseEllipsis) {
          setShowTime(true);
          setMaxLines(1);
        } else {
          // Rest of the multi-line logic
          const availableHeight = containerHeight - timeHeight;
          const possibleLines = Math.floor(availableHeight / lineHeight);
          
          titleElement.style.webkitLineClamp = 'unset';
          const actualTextHeight = titleElement.scrollHeight;
          const actualLines = Math.ceil(actualTextHeight / lineHeight);
          
          if (containerHeight < 50) {
            setShowTime(false);
            setMaxLines(1);
          } else if (actualLines <= 2) {
            setShowTime(true);
            setMaxLines(2);
          } else if (actualTextHeight + timeHeight > containerHeight) {
            setShowTime(false);
            setMaxLines(possibleLines);
          } else {
            setShowTime(true);
            setMaxLines(possibleLines - 1);
          }
        }
        
        titleElement.style.webkitLineClamp = maxLines.toString();
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [isShortEvent, scrollNumber, event.title]);

  return (
    <div style={{
      position: "absolute",
      top: topOffset,
      display: "flex",
      cursor: "pointer",
      width: 201,
      height: `calc(${height}px - 16px)`,
      zIndex: 2,
      marginLeft: event.track === "PRIMARY" ? 32 : 4,
      padding: 8
    }}>
      <div 
        ref={containerRef}
        onClick={() => {
          if (!isPreview) {
            setSelectedCalendarEvent(event);
            setLowerNav(true);
          }
        }}
        style={getEventStyles(isPreview, backgroundColor, isShortEvent, isOneHourEvent)}>
        <p
          ref={titleRef}
          contentEditable={isPreview}
          suppressContentEditableWarning={isPreview}
          onClick={(e) => isPreview && e.stopPropagation()}
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
            borderRadius: 4,
            transition: "background-color 0.2s",
            textOverflow: "ellipsis",
            display: useEllipsis ? "block" : "-webkit-box",
            overflow: "hidden",
            whiteSpace: useEllipsis ? "nowrap" : "normal",
            WebkitLineClamp: !useEllipsis ? maxLines : undefined,
            WebkitBoxOrient: !useEllipsis ? "vertical" : undefined,
            wordBreak: useEllipsis ? "normal" : "break-word",
            minHeight: isShortEvent ? "auto" : 24,
            flex: isShortEvent ? 1 : undefined
          }}
        >
          {event.title}
        </p>
        {!isShortEvent && showTime && (
          <p style={{
            margin: 0,
            fontSize: 12,
            color: "#fff",
            opacity: 0.8,
            whiteSpace: "nowrap",
            flexShrink: 0,
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}>
            {formatTime(eventStart)} - {formatTime(eventEnd)}
          </p>
        )}
      </div>
    </div>
  );
}; 