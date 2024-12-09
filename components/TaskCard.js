import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { EditTaskModal } from './EditTaskModal';

const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const MAX_DURATION = 23.99 * 60 * 60 * 1000; // Just under 24 hours in milliseconds

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

  
const formatTime = (date) => {
    const minutes = date.getUTCMinutes();
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: minutes === 0 ? undefined : '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).toLowerCase();
  };

export const TaskCard = ({ 
    task, 
    user,
    dayStart, 
    scrollNumber,
    titleInputRef,
    selectedEvent,
    setSelectedTask, 
    setSelectedEvent,  // Add this prop
    selectedTask, 
    columnId, 
    handleDeleteCalendarEvent,
    setSelectedTaskColumn, 
    selectedTaskColumn,
    editingTaskTitle,
    setEditingTaskTitle,
    editingTaskDescription, 
    setEditingTaskDescription,
    handleTaskUpdate,
    handleDeleteTask  // Add this prop
  }) => {
    // Add local state for immediate updates
    const [localTitle, setLocalTitle] = useState(task.title);
    const [localDescription, setLocalDescription] = useState(task.description || '');
    const [isNoteFocused, setIsNoteFocused] = useState(false);
  
    // Update local state when task changes
    useEffect(() => {
      setLocalTitle(task.title);
      setLocalDescription(task.description || '');
    }, [task]);
  
    // Safely parse dates
    let taskStart, taskEnd;
    try {
      // First check if the dates are already Date objects
      if (task.startTime instanceof Date) {
        taskStart = task.startTime;
      } else {
        // Try parsing the date string
        const startStr = task.startTime.replace(/Z$/, ''); // Remove Z if present
        taskStart = new Date(startStr + 'Z');
      }
  
      if (task.endTime instanceof Date) {
        taskEnd = task.endTime;
      } else {
        const endStr = task.endTime.replace(/Z$/, '');
        taskEnd = new Date(endStr + 'Z');
      }
  
      // Validate the dates
      if (isNaN(taskStart.getTime())) {
        console.error('Invalid start time:', task.startTime);
        return null;
      }
      if (isNaN(taskEnd.getTime())) {
        console.error('Invalid end time:', task.endTime);
        return null;
      }
  
    } catch (error) {
      console.error('Error parsing dates:', error, {
        startTime: task.startTime,
        endTime: task.endTime
      });
      return null;
    }
  
    // Format times with error handling
    let formattedStartTime, formattedEndTime;
    try {
      formattedStartTime = formatTime(taskStart);
      formattedEndTime = formatTime(taskEnd);
    } catch (error) {
      console.error('Error formatting times:', error, {
        taskStart,
        taskEnd
      });
      return null;
    }
  
    // Calculate dimensions with validation
    let topOffset, duration, height;
    try {
      if (!(dayStart instanceof Date) || isNaN(dayStart.getTime())) {
        console.error('Invalid dayStart:', dayStart);
        return null;
      }
  
      if (typeof scrollNumber !== 'number' || isNaN(scrollNumber)) {
        console.error('Invalid scrollNumber:', scrollNumber);
        return null;
      }
  
      const timeDiffHours = (taskStart - dayStart) / (1000 * 60 * 60);
      topOffset = timeDiffHours * (scrollNumber + 1);
      duration = (taskEnd - taskStart) / (1000 * 60 * 60);
      height = duration * (scrollNumber + 1);
  
      if (isNaN(topOffset) || isNaN(height)) {
        console.error('Invalid calculations:', {
          timeDiffHours,
          topOffset,
          duration,
          height,
          taskStart: taskStart.getTime(),
          taskEnd: taskEnd.getTime(),
          dayStart: dayStart.getTime(),
          scrollNumber
        });
        return null;
      }
    } catch (error) {
      console.error('Error calculating dimensions:', error);
      return null;
    }
  
    // Update the isShortTask calculation to be more nuanced based on scrollNumber
    const isShortTask = ((duration < 1 && scrollNumber <= 150) || 
                       (duration <= 0.25 && scrollNumber >= 150) || 
                       (duration <= 0.5 && scrollNumber >= 80)) && !(scrollNumber >= 300)
    const isOneHourTask = ((duration === 1 && scrollNumber < 120)) && !(scrollNumber >= 300)
  
    let isSelected = selectedTask?.id === task.id && selectedTaskColumn === columnId
  
    // Move sortedPeople memo outside of the callback
    const sortedPeople = useMemo(() => {
      if (!task.assignedTo) return [];
      
      return [...task.assignedTo].sort((a, b) => {
        const aIsColumnPerson = columnId === 'You' ? 
          a.email === user.email : 
          a.name === columnId;
        const bIsColumnPerson = columnId === 'You' ? 
          b.email === user.email : 
          b.name === columnId;

        if (aIsColumnPerson) return -1;
        if (bIsColumnPerson) return 1;

        if (a.profilePicture && !b.profilePicture) return -1;
        if (!a.profilePicture && b.profilePicture) return 1;
        return 0;
      });
    }, [task.assignedTo, columnId, user.email]);
  
    const renderProfilePictures = useCallback((people, limit) => {
      if (isShortTask || isOneHourTask) {
        // Find the person matching the column ID
        let columnPerson;
        if (columnId === 'You') {
          columnPerson = sortedPeople.find(person => person.email === user.email);
        } else {
          columnPerson = sortedPeople.find(person => person.name === columnId);
        }

        if (!columnPerson) return null;
        
        return (
          <div 
            key={0}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: columnPerson.profilePicture ? "transparent" : "#666",
              backgroundImage: columnPerson.profilePicture ? `url("${columnPerson.profilePicture}")` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#EBEBEB",
              fontSize: "10px",
              fontWeight: 500
            }}
          >
            {!columnPerson.profilePicture && getInitials(columnPerson.name)}
          </div>
        );
      } else {
        // For longer tasks: show up to 4 profiles + overflow
        const remainingCount = people.length - 4;
        let displayCount = Math.min(people.length, 4);
        
        if (remainingCount === 1) {
          displayCount = Math.min(people.length, 5);
        }
        
        const displayPeople = sortedPeople.slice(0, displayCount);
        const overflow = people.length > 5;

        return (
          <>
            {displayPeople.map((person, personIndex) => (
              <div 
                key={personIndex}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: person.profilePicture ? "transparent" : "#666",
                  backgroundImage: person.profilePicture ? `url(${person.profilePicture})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#EBEBEB",
                  fontSize: "12px",
                  fontWeight: 500
                }}
              >
                {!person.profilePicture && getInitials(person.name)}
              </div>
            ))}
            {overflow && (
              <div 
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#EBEBEB",
                  fontSize: "12px",
                  fontWeight: 500
                }}
              >
                +{people.length - 5}
              </div>
            )}
          </>
        );
      }
    }, [sortedPeople, columnId, user.email, isShortTask, isOneHourTask]);
  
    const dropdownTriggerRef = useRef(null);
  
    return (
      <div 
        onClick={() => {
          // console.log(task)
          setSelectedTask(task);
          setSelectedTaskColumn(columnId);
          setEditingTaskTitle(task.title);
          setEditingTaskDescription(task.description || '');
          setLocalTitle(task.title);
          setLocalDescription(task.description || '');
          // console.log(columnId, selectedTaskColumn, columnId == selectedTaskColumn)
        }}
        style={{
          position: "absolute",
          top: topOffset,
          cursor: "pointer",
          width: 201,
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
          height: height,
          zIndex: (isSelected) ? 103 : 'auto'
        }}>
          {isSelected &&           
          <EditTaskModal 
            user={user}
            handleDeleteTask={handleDeleteTask}
            task={task}
            titleInputRef={titleInputRef}
            localTitle={localTitle}
            setLocalTitle={setLocalTitle}
            setSelectedTask={setSelectedTask}
            setEditingTaskTitle={setEditingTaskTitle}
            handleTaskUpdate={handleTaskUpdate}
            formattedStartTime={formattedStartTime}
            taskStart={taskStart}
            taskEnd={taskEnd}
            formattedEndTime={formattedEndTime}
            setSelectedEvent={setSelectedEvent}
            dropdownTriggerRef={dropdownTriggerRef}
            selectedEvent={selectedEvent}
            localDescription={localDescription}
            setLocalDescription={setLocalDescription}
            setEditingTaskDescription={setEditingTaskDescription}
            isNoteFocused={isNoteFocused}
            setIsNoteFocused={setIsNoteFocused}
          />
  
         }
        <div style={{
          backgroundColor: "#fff",
          justifyContent: (isShortTask || isOneHourTask) ? "center" : "space-between",
          display: "flex",
          width: "calc(100% - 32px)",
          marginLeft: 16,
          flexDirection: "column",
          height: "calc(100% - 48px)",
          borderRadius: 8,
          padding: 12,
          border: "1px solid #000"
        }}>
          {(isShortTask || isOneHourTask) ? (
            // Compact layout for short tasks
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "space-between"
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2
                }}>
                  <p style={{
                    margin: 0,
                    color: "#333333",
                    opacity: 1.0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "130px",
                    cursor: "text", 
                    
                  }}>
                    {task.title}
                  </p>
                  
                </div>
                <div style={{
                  display: "flex",
                  gap: 4,
                  flexShrink: 0
                }}>
                  {renderProfilePictures(task.assignedTo, 3)}
                </div>
              </div>
            </div>
          ) : (
            // Original layout for longer tasks
            <>
              <p style={{margin: 0, color: "#333333", opacity: 1.0}}>
                {task.title}
              </p>
              <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                <div style={{display: "flex", gap: 4}}>
                  {renderProfilePictures(task.assignedTo, 3)}
                </div>
  
                <p style={{margin: 0, fontSize: 14, opacity: 0.8}}>
                  {formattedStartTime} - {formattedEndTime}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };


