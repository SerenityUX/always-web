import {useState, useRef, useEffect, useMemo} from 'react'

export const commonTimezones = {
    "America/Los_Angeles": "(GMT-08:00) Pacific Time",
    "America/Denver": "(GMT-07:00) Mountain Time",
    "America/Chicago": "(GMT-06:00) Central Time",
    "America/New_York": "(GMT-05:00) Eastern Time",
    "Europe/London": "(GMT+00:00) London",
    "Europe/Paris": "(GMT+01:00) Paris",
    "Asia/Tokyo": "(GMT+09:00) Tokyo",
    "Asia/Shanghai": "(GMT+08:00) Shanghai",
    "Australia/Sydney": "(GMT+11:00) Sydney"
  }; 

const setTimeWithoutDate = (baseDate, timeDate) => {
  const newDate = new Date(baseDate);
  newDate.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
  return newDate;
};

const stripTime = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const formatTimezone = (tz) => {
  const offset = new Date().toLocaleString('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
    .split(' ').pop();
  const city = tz.split('/').pop().replace(/_/g, ' ');
  return { offset, city };
};

const TimezoneSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentTz = formatTimezone(value);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          borderRadius: 4, 
          cursor: "pointer", 
          flexDirection: "column",
          width: 80,
          justifyContent: "space-between",
          height: "calc(100% - 18px)",
          overflow: "hidden",
          backgroundColor: "#fff", 
          border: "1px solid #EBEBEB", 
          display: "flex", 
          gap: 8,
          padding: 8
        }}
      >
        <img style={{width: 20, height: 20}} src="./icons/language.svg" alt="timezone"/>
        <div>
          <p style={{margin: 0, fontSize: 14}}>{currentTz.offset}</p>
          <p style={{margin: 0, fontSize: 10}}>{currentTz.city}</p>
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: 200,
          maxHeight: '300px',
          overflowY: 'auto',
          backgroundColor: '#fff',
          border: '1px solid #EBEBEB',
          borderRadius: 4,
          marginTop: 4,
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {/* Common Timezones */}
          {[
            "America/Los_Angeles",
            "America/Denver",
            "America/Chicago",
            "America/New_York",
            "Europe/London",
            "Europe/Paris",
            "Asia/Tokyo",
            "Asia/Shanghai",
            "Australia/Sydney"
          ].map(tz => {
            const formatted = formatTimezone(tz);
            return (
              <div
                key={tz}
                onClick={() => {
                  onChange(tz);
                  setIsOpen(false);
                }}
                style={{
                  padding: 8,
                  cursor: 'pointer',
                  backgroundColor: value === tz ? '#f5f5f5' : '#fff',
                  ':hover': { backgroundColor: '#f5f5f5' }
                }}
              >
                <p style={{margin: 0, fontSize: 14}}>{formatted.offset}</p>
                <p style={{margin: 0, fontSize: 10}}>{formatted.city}</p>
              </div>
            );
          })}
          
          <div style={{borderTop: '1px solid #EBEBEB', padding: '4px 8px', backgroundColor: '#f5f5f5'}}>
            <p style={{margin: 0, fontSize: 12, color: '#666'}}>All Timezones</p>
          </div>
          
          {Intl.supportedValuesOf('timeZone').map(tz => {
            const formatted = formatTimezone(tz);
            return (
              <div
                key={tz}
                onClick={() => {
                  onChange(tz);
                  setIsOpen(false);
                }}
                style={{
                  padding: 8,
                  cursor: 'pointer',
                  backgroundColor: value === tz ? '#f5f5f5' : '#fff',
                  ':hover': { backgroundColor: '#f5f5f5' }
                }}
              >
                <p style={{margin: 0, fontSize: 14}}>{formatted.offset}</p>
                <p style={{margin: 0, fontSize: 10}}>{formatted.city}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const WelcomeView = ({
  handleCreateFirstEvent,
  createEventError,
  isSubmitting,
  createEventForm,
  setCreateEventForm
}) => {

  return (
    <div style={{
      flex: 1,
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      color: "#59636E", 
      textAlign: "center", 
      gap: 16,
      flexDirection: "column"
    }}>
      <img style={{height: 128, marginTop: 24, width: 128}} src="./outline.gif"/>
      <p style={{margin: 0}}>welcome to <span style={{fontWeight: 700, color: "#000"}}>always</span>, let's get started<br/></p>
      
      <div style={{width: 500, textAlign: "left", display: "flex", flexDirection: "column", padding: 32, marginTop: 24, borderRadius: 8, border: "1px solid #EBEBEB", backgroundColor: "#fff"}}>
        {createEventError && (
          <div style={{
            color: 'red',
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#ffebee',
            borderRadius: '4px'
          }}>
            {createEventError}
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          // Format the dates back to the expected format
          const formattedForm = {
            title: createEventForm.title,
            startDate: new Date(createEventForm.startDate).toISOString().split('T')[0],
            startTime: new Date(createEventForm.startDate).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }),
            endDate: new Date(createEventForm.endDate).toISOString().split('T')[0],
            endTime: new Date(createEventForm.endDate).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }),
            timezone: createEventForm.timezone
          };
          console.log('Form submission - formatted form:', formattedForm);
          handleCreateFirstEvent(e);
        }} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1'
          }}>
            <label style={{
              marginBottom: '8px', 
              fontSize: '14px'
            }}>
              Event Name
            </label>
            <input
              type="text"
              value={createEventForm.title}
              onChange={(e) => setCreateEventForm(prev => ({...prev, title: e.target.value}))}
              required
              style={{
                flex: '1',
                padding: '8px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #EBEBEB'
              }}
            />
          </div>

          {(createEventForm.title != "" && createEventForm.title != null) && (
            <>

                <div style={{
                  display: "flex", 
                  fontSize: 16, 
                  flexDirection: "row", 
                  gap: 12,
                  animation: 'fadeIn 0.3s ease-in-out',
                  opacity: 0,
                  animationFillMode: 'forwards'
                }}>
                  <style jsx>{`
                    @keyframes fadeIn {
                      from {
                        opacity: 0;
                        transform: translateY(-10px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                  `}</style>
                  <div style={{width: "100%", padding: 8, gap: 0, border: "1px solid #EBEBEB", borderRadius: 4, backgroundColor: "rgba(0, 0, 0, 0.00)", display: "flex", flexDirection: "row"}}>
                    <div style={{display: "flex", alignItems: "center", flexDirection: "column", marginTop: 4, marginRight: 8,}}>
                        <div style={{height: 8, marginTop: 8, width: 8, backgroundColor: "rgba(0, 0, 0, 0.5)", borderRadius: 4}}></div>
                        <div style={{height: 28, marginTop: 1, marginBottom: 1, width: 0.1, borderLeft: "0.5px dashed rgba(0, 0, 0, 0.5)", borderRight: "0.5px dashed rgba(0, 0, 0, 0.5)", borderImage: "repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0, rgba(0, 0, 0, 0.5) 4px, transparent 4px, transparent 8px) 1"}}>

                        </div>
                        <div style={{height: 6, border: "1px solid rgba(0, 0, 0, 0.5)", width: 6, backgroundColor: "rgba(0, 0, 0, 0.0)", borderRadius: 4}}></div>

                    </div>
                    <div style={{flexDirection: "column", width: "100%", gap: 8, display: "flex"}}>
                        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexDirection: "row"}}>
                            <p style={{margin: 0, fontSize: 16, paddingTop: 0, paddingBottom: 0, fontSize: 16, lineHeight: 1}}>Start</p>
                            <div style={{display: 'flex', flexDirection: "row", gap: 4}}>
                              <CustomDateTimeSelect
                                value={createEventForm.startDate}
                                onChange={(date) => {
                                  setCreateEventForm(prev => ({...prev, startDate: date}));
                                }}
                                type="date"
                              />
                              <CustomDateTimeSelect
                                value={createEventForm.startTime}
                                onChange={(timeString) => {
                                  setCreateEventForm(prev => ({...prev, startTime: timeString}));
                                }}
                                type="time"
                                isStartTime={true}
                              />
                            </div>
                        </div>
                        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexDirection: "row"}}>
                            <p style={{margin: 0, fontSize: 16, paddingTop: 0, paddingBottom: 0, fontSize: 16, lineHeight: 1}}>End</p>
                            <div style={{display: 'flex', flexDirection: "row", gap: 4}}>
                              <CustomDateTimeSelect
                                value={createEventForm.endDate}
                                onChange={(date) => {
                                  setCreateEventForm(prev => ({...prev, endDate: date}));
                                }}
                                type="date"
                              />
                              <CustomDateTimeSelect
                                value={createEventForm.endTime}
                                onChange={(timeString) => {
                                  setCreateEventForm(prev => ({...prev, endTime: timeString}));
                                }}
                                type="time"
                                isStartTime={false}
                              />
                            </div>
                        </div>
                    </div>
                </div>
                <TimezoneSelect
                  value={createEventForm.timezone}
                  onChange={(timezone) => setCreateEventForm(prev => ({...prev, timezone}))}
                />
            </div>
              {/* <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1',
                  animation: 'fadeIn 0.3s ease-in-out'
                }}
              >
                <style jsx>{`
                  @keyframes fadeIn {
                    from {
                      opacity: 0;
                      transform: translateY(-10px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
                <label style={{
                  marginBottom: '8px', 
                  fontSize: '14px'
                }}>
                  Timezone
                </label>
                <select
                  value={createEventForm.timezone}
                  onChange={(e) => setCreateEventForm(prev => ({...prev, timezone: e.target.value}))}
                  required
                  style={{
                    flex: '1',
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '1px solid #EBEBEB',
                    backgroundColor: '#fff'
                  }}
                >
                  <optgroup label="Common Timezones">
                    {Object.entries(commonTimezones).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Timezones">
                    {Intl.supportedValuesOf('timeZone').map(tz => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  animation: 'fadeIn 0.3s ease-in-out',
                  animationDelay: '0.1s',
                  opacity: 0,
                  animationFillMode: 'forwards'
                }}
              >
                <div style={{display: 'flex', gap: '16px'}}>
                  <DateTimeInput
                    label="Start Date"
                    type="date"
                    value={createEventForm.startDate}
                    onChange={(e) => setCreateEventForm(prev => ({...prev, startDate: e.target.value}))}
                  />
                  <DateTimeInput
                    label="Start Time"
                    type="time"
                    value={createEventForm.startTime}
                    onChange={(e) => setCreateEventForm(prev => ({...prev, startTime: e.target.value}))}
                  />
                </div>

                <div style={{display: 'flex', gap: '16px'}}>
                  <DateTimeInput
                    label="End Date"
                    type="date"
                    value={createEventForm.endDate}
                    onChange={(e) => setCreateEventForm(prev => ({...prev, endDate: e.target.value}))}
                  />
                  <DateTimeInput
                    label="End Time"
                    type="time"
                    value={createEventForm.endTime}
                    onChange={(e) => setCreateEventForm(prev => ({...prev, endTime: e.target.value}))}
                  />
                </div>
              </div> */}
            </>
          )}

          <button
            type="submit"
            disabled={(createEventForm.title == "" || createEventForm.title == null) || isSubmitting}
            style={{
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (createEventForm.title == "" || createEventForm.title == null) || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: (createEventForm.title == "" || createEventForm.title == null) || isSubmitting ? 0.7 : 1,
              marginTop: '8px',
              animation: "* 0.3 ease-in"
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create First Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

const DateTimeInput = ({ label, type, value, onChange }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    flex: '1'
  }}>
    <label style={{
      marginBottom: '8px', 
      fontSize: '14px'
    }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      required
      style={{
        flex: '1',
        padding: '8px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #EBEBEB'
      }}
    />
  </div>
); 

const CustomDateTimeSelect = ({ value, onChange, type = "date", isStartTime = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const timeListRef = useRef(null);
  const selectedTimeRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && timeListRef.current && selectedTimeRef.current) {
      // Simple, direct scroll to the selected time
      selectedTimeRef.current.scrollIntoView({
        block: 'center',
        behavior: 'instant' // Use instant instead of auto
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

  // Convert string date to Date object if needed
  const safeDate = value instanceof Date ? value : (() => {
    const date = new Date();
    if (type === "date") {
      const [year, month, day] = value.split('-');
      date.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (type === "time") {
      const [hours, minutes] = value.split(':');
      if (hours && minutes) {
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        // Set default times based on whether it's start or end time
        date.setHours(isStartTime ? 9 : 17, 0, 0, 0);
      }
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
    
    // Generate 3 sets of times for infinite scroll
    for (let set = 0; set < 3; set++) {
      // 6 AM to midnight
      for (let hour = 6; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const date = new Date(baseDate);
          date.setHours(hour, minute, 0, 0);
          options.push(date);
        }
      }
      
      // Midnight to 5:30 AM
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

  const handleTimeChange = (selectedTime) => {
    if (type === "time") {
      // Only update the hours and minutes, don't touch the date
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      onChange(timeString);
    } else {
      onChange(selectedTime);
    }
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
                onChange(e.target.value); // Keep string format
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
            // if (!hasScrolled) return; // Don't handle scrolls until initial positioning is done
            
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
                onClick={() => {
                  if (type === "time") {
                    const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
                    onChange(timeString);
                  } else {
                    const newDate = new Date(safeDate);
                    newDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
                    onChange(newDate);
                  }
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
                {formatDate(time)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}; 
