import { useState, useRef, useEffect } from 'react';

const CustomDateTimeSelect = ({ value, onChange, type = "date", isStartTime = true }) => {
  const [isOpen, setIsOpen] = useState(false);
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
        existingDate.setHours(isStartTime ? 9 : 17, 0, 0, 0);
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
        day: 'numeric'
      }).format(date);
    }
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const generateTimeOptions = () => {
    const options = [];
    const baseDate = new Date();
    
    for (let set = 0; set < 3; set++) {
      for (let hour = 6; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const date = new Date(baseDate);
          date.setHours(hour, minute, 0, 0);
          options.push(date);
        }
      }
      
      for (let hour = 0; hour <= 5; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const date = new Date(baseDate);
          date.setHours(hour, minute, 0, 0);
          options.push(date);
        }
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
            minWidth: '120px',
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
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            border: '1px solid #EBEBEB',
            borderRadius: '4px',
            padding: '6px 8px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#fff',
            minWidth: '80px'
          }}
        >
          {formatDate(safeDate)}
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
          {generateTimeOptions().map((time, index) => {
            const isSelected = time.getHours() === safeDate.getHours() && 
                             time.getMinutes() === safeDate.getMinutes();
            return (
              <div
                key={index}
                ref={isSelected ? selectedTimeRef : null}
                data-selected={isSelected}
                onClick={() => handleTimeSelect(time)}
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
                {formatDate(time)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomDateTimeSelect; 