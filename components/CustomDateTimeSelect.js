import { useState, useRef, useEffect } from 'react';

 const CustomDateTimeSelect = ({ value, onChange, type = "date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const timeListRef = useRef(null);
  const selectedTimeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && timeListRef.current && selectedTimeRef.current) {
      selectedTimeRef.current.scrollIntoView({
        block: 'center',
        behavior: 'instant'
      });
    }
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const safeDate = value instanceof Date ? value : (() => {
    const date = new Date();
    if (type === "date") {
      const [year, month, day] = value.split('-');
      date.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (type === "time") {
      const existingDate = value instanceof Date ? value : new Date(value);
      if (typeof value === 'string' && value.includes(':')) {
        const [hours, minutes] = value.split(':');
        if (hours && minutes) {
          existingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
      } else {
        existingDate.setHours(9, 0, 0, 0);
      }
      return existingDate;
    }
    return date;
  })();

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      date = new Date();
    }
    
    if (type === "date") {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).format(date);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        options.push({ displayTime: timeString, hour, minute });
      }
    }
    return options;
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.showPicker();
    }
  };

  const handleTimeSelect = (time) => {
    const originalDate = value instanceof Date ? value : new Date(value);
    const newDate = new Date(originalDate.getTime());
    
    newDate.setHours(time.getHours());
    newDate.setMinutes(time.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    onChange(newDate);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {type === "date" ? (
        <div 
          onClick={handleClick}
          style={{
            border: '1px solid #EBEBEB',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '14px',
            backgroundColor: '#fff',
            // minWidth: '120px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          {formatDate(safeDate)}
          <input
            ref={inputRef}
            type="date"
            value={typeof value === 'string' ? value : safeDate.toISOString().split('T')[0]}
            onChange={(e) => {
              if (typeof value === 'string') {
                onChange(e.target.value);
              } else {
                const [year, month, day] = e.target.value.split('-').map(Number);
                const newDate = new Date(safeDate);
                newDate.setFullYear(year, month - 1, day);
                onChange(newDate);
              }
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              pointerEvents: 'none'
            }}
          />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={inputValue || formatDate(safeDate)}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            onBlur={(e) => {
              const input = e.target.value.toUpperCase();
              // Remove extra spaces and normalize input
              const normalizedInput = input.replace(/\s+/g, '');
              
              // Try different patterns
              const patterns = [
                /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM|A|P)?$/i,  // 11:30PM or 11PM or 11 or 11:30
                /^(\d{1,2})(AM|PM|A|P)$/i,                    // 11AM or 11A
              ];

              let match = null;
              let hours = 0;
              let minutes = 0;
              let period = '';

              for (const pattern of patterns) {
                match = normalizedInput.match(pattern);
                if (match) {
                  // Remove the first element (full match) and get the remaining groups
                  const [fullMatch, ...groups] = match;
                  
                  if (groups.length === 3) {
                    // Format: 11:30PM
                    [hours, minutes, period] = groups;
                    minutes = parseInt(minutes);
                  } else if (groups.length === 2) {
                    // Format: 11AM
                    [hours, period] = groups;
                    minutes = 0;
                  } else {
                    // Format: 11:30 or 11
                    [hours, minutes = '0'] = groups;
                    minutes = parseInt(minutes);
                  }
                  break;
                }
              }

              if (match) {
                hours = parseInt(hours);
                
                // Normalize period (AM/PM)
                if (period) {
                  period = period.charAt(0) === 'P' ? 'PM' : 'AM';
                } else {
                  // If no period specified, use AM for hours <= 11, PM for hours >= 12
                  period = hours >= 12 ? 'PM' : 'AM';
                }

                // Validate hours and minutes
                if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes < 60) {
                  if (period === 'PM' && hours !== 12) hours += 12;
                  if (period === 'AM' && hours === 12) hours = 0;
                  
                  const newDate = new Date(safeDate);
                  newDate.setUTCHours(hours, minutes, 0, 0);
                  onChange(newDate);
                  setInputValue(''); // Clear input value to show formatted time
                } else {
                  setInputValue(formatDate(safeDate));
                }
              } else {
                setInputValue(formatDate(safeDate));
              }
            }}
            onClick={() => setIsOpen(true)}
            style={{
              border: '1px solid #EBEBEB',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '14px',
              backgroundColor: '#fff',
              minWidth: '90px',
              cursor: 'pointer'
            }}
          />
        </div>
      )}

      {isOpen && type === "time" && (
        <div 
          ref={timeListRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1000,
            backgroundColor: '#fff',
            border: '1px solid #EBEBEB',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            width: '120px',
            scrollBehavior: 'smooth'
          }}
          onScroll={(e) => {
            const element = e.target;
            const { scrollTop, scrollHeight, clientHeight } = element;
            
            if (scrollTop < 100) {
              element.style.scrollBehavior = 'auto';
              element.scrollTop = scrollHeight / 3;
              element.style.scrollBehavior = 'smooth';
            } else if (scrollTop + clientHeight > scrollHeight - 100) {
              element.style.scrollBehavior = 'auto';
              element.scrollTop = scrollHeight / 3;
              element.style.scrollBehavior = 'smooth';
            }
          }}
        >
          {generateTimeOptions().map(({ displayTime, hour, minute }, index) => {
            const isSelected = hour === safeDate.getUTCHours() && 
                             minute === safeDate.getUTCMinutes();
            return (
              <div
                key={index}
                ref={isSelected ? selectedTimeRef : null}
                data-selected={isSelected}
                onClick={() => {
                  const newDate = new Date(safeDate);
                  newDate.setUTCHours(hour, minute, 0, 0);
                  onChange(newDate);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#007AFF' : '#fff',
                  color: isSelected ? '#fff' : '#000',
                  borderRadius: '4px',
                  margin: '2px 4px',
                  ':hover': {
                    backgroundColor: isSelected ? '#007AFF' : '#f5f5f5'
                  }
                }}
              >
                {displayTime}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomDateTimeSelect; 