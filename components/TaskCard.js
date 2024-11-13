import { useState, useEffect } from 'react';

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
    const renderProfilePictures = (people, limit) => {
      // Sort people: those with profile pictures come first
      const sortedPeople = [...people].sort((a, b) => {
        if (a.profilePicture && !b.profilePicture) return -1;
        if (!a.profilePicture && b.profilePicture) return 1;
        return 0;
      });
  
      if (isShortTask || isOneHourTask) {
        // For short tasks and one-hour tasks: show only first person
        const person = sortedPeople[0];
        if (!person) return null;
        
        return (
          <div 
            key={0}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: person.profilePicture ? "transparent" : "#666",
              backgroundImage: person.profilePicture ? `url(${person.profilePicture})` : "none",
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
            {!person.profilePicture && getInitials(person.name)}
          </div>
        );
      } else {
        // For longer tasks: show up to 4 profiles + overflow
        const remainingCount = people.length - 4;
        let displayCount = Math.min(people.length, 4);
        
        // If there's only one more person beyond the limit, increase display count
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
    };
  
    return (
      <div 
        onClick={() => {
          console.log(task)
          setSelectedTask(task);
          setSelectedTaskColumn(columnId);
          setEditingTaskTitle(task.title);
          setEditingTaskDescription(task.description || '');
          setLocalTitle(task.title);
          setLocalDescription(task.description || '');
          console.log(columnId, selectedTaskColumn, columnId == selectedTaskColumn)
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
          {isSelected &&           <div style={{position: "absolute", fontSize: "16", cursor: "auto", top: 16, left: 228, borderRadius: 8, width: 300, backgroundColor: "#fff"}}>
                                                    <div style={{width: "calc(100% - 24px)", borderRadius: "16px 16px 0px 0px", paddingTop: 8, paddingBottom: 8, justifyContent: "space-between", paddingLeft: 16, paddingRight: 8, alignItems: "center", display: "flex", backgroundColor: "#F6F8FA"}}>
                                                    <p onClick={() => console.log(user)} style={{margin: 0, fontSize: 14}}>Edit Task</p>
                                                    <img 
                                                      onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this task?')) {
                                                          handleDeleteTask(task.id);
                                                        }
                                                      }}
                                                      style={{width: 24, height: 24, cursor: "pointer"}} 
                                                      src="/icons/trash.svg"
                                                    />
                                                    </div> 
                                                    <div style={{display: "flex", gap: 16, padding: 16, flexDirection: "column"}}>
                                                    <input
    ref={titleInputRef}
    value={localTitle}
    onChange={(e) => {
      const newTitle = e.target.value;
      setLocalTitle(newTitle);
      setSelectedTask(prev => ({
        ...prev,
        title: newTitle
      }));
      setEditingTaskTitle(newTitle);
    }}
    onKeyDown={async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    }}
    onBlur={async () => {
      if (localTitle !== task.title) {
        try {
          await handleTaskUpdate(task.id, { title: localTitle });
        } catch (error) {
          setLocalTitle(task.title);
          setEditingTaskTitle(task.title);
          setSelectedTask(prev => ({
            ...prev,
            title: task.title
          }));
        }
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
      border: "1px solid transparent",
      transition: "border-color 0.2s"
    }}
  />
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
                                                            {formattedStartTime}
                                                          </p>
                                                          <input 
                                                            type="time"
                                                            value={`${taskStart.getUTCHours().toString().padStart(2, '0')}:${taskStart.getUTCMinutes().toString().padStart(2, '0')}`}
                                                            onChange={async (e) => {
                                                              const newStartTime = timeStringToDate(e.target.value, taskStart);
                                                              const duration = taskEnd - taskStart;
                                                              const newEndTime = new Date(newStartTime.getTime() + duration);
                                                              
                                                              try {
                                                                await handleTaskUpdate(task.id, { 
                                                                  startTime: newStartTime.toISOString(),
                                                                  endTime: newEndTime.toISOString()
                                                                });
                                                              } catch (error) {
                                                                console.error('Failed to update task times:', error);
                                                              }
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
                                                            {formattedEndTime}
                                                          </p>
                                                          <input 
                                                            type="time"
                                                            value={`${taskEnd.getUTCHours().toString().padStart(2, '0')}:${taskEnd.getUTCMinutes().toString().padStart(2, '0')}`}
                                                            onChange={async (e) => {
                                                              const startTime = taskStart;
                                                              let newEndTime = timeStringToDate(e.target.value, taskEnd);
                                                              
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
                                                              
                                                              try {
                                                                await handleTaskUpdate(task.id, { 
                                                                  startTime: startTime.toISOString(),
                                                                  endTime: newEndTime.toISOString()
                                                                });
                                                              } catch (error) {
                                                                console.error('Failed to update task times:', error);
                                                              }
                                                            }}
                                                            style={{
                                                              position: "absolute",
                                                              opacity: 0,
                                                              pointerEvents: "none"
                                                            }}
                                                          />
                                                        </div>
                                                      </div>
                                                      <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                                                        <p style={{margin: 0, fontSize: 14, color: "#666"}}>Assigned To</p>
                                                        
                                                        {/* List current assignments */}
                                                        <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                                                          {task.assignedTo.map((person, index) => (
                                                            <div key={index} style={{
                                                              display: "flex",
                                                              alignItems: "center",
                                                              padding: "8px",
                                                              backgroundColor: "#F6F8FA",
                                                              borderRadius: "8px",
                                                              gap: "8px"
                                                            }}>
                                                              <div style={{
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
                                                                fontWeight: 500,
                                                                flexShrink: 0
                                                              }}>
                                                                {!person.profilePicture && getInitials(person.name)}
                                                              </div>
                                                              <div style={{
                                                                flex: 1,
                                                                minWidth: 0
                                                              }}>
                                                                <p style={{
                                                                  margin: 0, 
                                                                  fontSize: 14,
                                                                  whiteSpace: "nowrap",
                                                                  overflow: "hidden",
                                                                  textOverflow: "ellipsis"
                                                                }}>{person.name}</p>
                                                                <p style={{
                                                                  margin: 0, 
                                                                  fontSize: 12, 
                                                                  color: "#666",
                                                                  whiteSpace: "nowrap",
                                                                  overflow: "hidden",
                                                                  textOverflow: "ellipsis"
                                                                }}>{person.email}</p>
                                                              </div>
                                                              <img 
    onClick={async (e) => {
      e.stopPropagation();
      if (window.confirm(`Remove ${person.name} from this task?`)) {
        try {
          const response = await fetch('https://serenidad.click/hacktime/unassignEventTask', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: localStorage.getItem('token'),
              taskId: task.id,
              userEmailToRemove: person.email
            }),
          });
  
          console.log(task.id, person.email)
          if (!response.ok) {
            throw new Error('Failed to unassign user');
          }
  
          const updatedTask = await response.json();
          
          // Update local state
          setSelectedTask(prev => ({
            ...prev,
            assignedTo: updatedTask.assignedTo
          }));
  
          // Update the event's tasks array
          setSelectedEvent(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => 
              t.id === task.id ? { ...t, assignedTo: updatedTask.assignedTo } : t
            )
          }));
        } catch (error) {
          console.error('Failed to unassign user:', error);
          alert('Failed to unassign user');
        }
      }
    }}
    src="/icons/trash.svg" 
    style={{
      width: 20,
      height: 20,
      cursor: "pointer",
      opacity: 0.5,
      transition: "opacity 0.2s",
      flexShrink: 0
    }}
    onMouseOver={e => e.target.style.opacity = 1}
    onMouseOut={e => e.target.style.opacity = 0.5}
  />
                                                            </div>
                                                          ))}
                                                        </div>
  
                                                        {/* Add new assignment */}
                                                        <div style={{
                                                          padding: "8px",
                                                          border: "1px dashed #666",
                                                          borderRadius: "8px",
                                                          cursor: "pointer",
                                                          transition: "background-color 0.2s"
                                                        }}
                                                        onClick={() => {
                                                          console.log("user email", user.email)
                                                          // Show dropdown of available team members
                                                          const availableMembers = selectedEvent.teamMembers
                                                            .filter(member => !task.assignedTo.some(assigned => assigned.email === member.email));
  
                                                          // Always add current user if not already assigned
                                                          if (user && !task.assignedTo.some(assigned => assigned.email === user.email)) {
                                                            // Add user at the beginning of the list
                                                            availableMembers.unshift({
                                                              email: user.email,
                                                              name: user.name,
                                                              profilePicture: user.profile_picture_url
                                                            });
                                                          }
  
                                                          if (availableMembers.length === 0) {
                                                            alert('All team members are already assigned to this task');
                                                            return;
                                                          }
  
                                                          // Create and show dropdown
                                                          const dropdown = document.createElement('div');
                                                          dropdown.style.position = 'absolute';
                                                          dropdown.style.backgroundColor = '#fff';
                                                          dropdown.style.border = '1px solid #D0D7DE';
                                                          dropdown.style.borderRadius = '8px';
                                                          dropdown.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                                          dropdown.style.maxHeight = '200px';
                                                          dropdown.style.overflowY = 'auto';
                                                          dropdown.style.width = '268px';
                                                          dropdown.style.zIndex = '1000';
  
                                                          availableMembers.forEach(member => {
                                                            const option = document.createElement('div');
                                                            option.style.padding = '8px';
                                                            option.style.display = 'flex';
                                                            option.style.alignItems = 'center';
                                                            option.style.gap = '8px';
                                                            option.style.cursor = 'pointer';
                                                            option.style.transition = 'background-color 0.2s';
  
                                                            const avatar = document.createElement('div');
                                                            avatar.style.width = '32px';
                                                            avatar.style.height = '32px';
                                                            avatar.style.borderRadius = '16px';
                                                            avatar.style.backgroundColor = member.profilePicture ? 'transparent' : '#666';
                                                            avatar.style.backgroundImage = member.profilePicture ? `url(${member.profilePicture})` : 'none';
                                                            avatar.style.backgroundSize = 'cover';
                                                            avatar.style.backgroundPosition = 'center';
                                                            avatar.style.display = 'flex';
                                                            avatar.style.alignItems = 'center';
                                                            avatar.style.justifyContent = 'center';
                                                            avatar.style.color = '#EBEBEB';
                                                            avatar.style.fontSize = '12px';
                                                            avatar.style.fontWeight = '500';
  
                                                            if (!member.profilePicture) {
                                                              avatar.textContent = getInitials(member.name);
                                                            }
  
                                                            const info = document.createElement('div');
                                                            info.innerHTML = `
                                                              <p style="margin: 0; font-size: 14px">${member.name}</p>
                                                              <p style="margin: 0; font-size: 12px; color: #666">${member.email}</p>
                                                            `;
  
                                                            option.appendChild(avatar);
                                                            option.appendChild(info);
  
                                                            option.onmouseover = () => {
                                                              option.style.backgroundColor = '#F6F8FA';
                                                            };
                                                            option.onmouseout = () => {
                                                              option.style.backgroundColor = 'transparent';
                                                            };
  
                                                            option.onclick = async () => {
                                                              try {
                                                                const response = await fetch('https://serenidad.click/hacktime/assignEventTask', {
                                                                  method: 'POST',
                                                                  headers: {
                                                                    'Content-Type': 'application/json',
                                                                  },
                                                                  body: JSON.stringify({
                                                                    token: localStorage.getItem('token'),
                                                                    eventId: selectedEvent.id, // Add the eventId
                                                                    taskId: task.id,
                                                                    assigneeEmail: member.email
                                                                  }),
                                                                });
  
                                                                const data = await response.json();
                                                                
                                                                if (!response.ok) {
                                                                  throw new Error(data.error || 'Failed to assign user');
                                                                }
  
                                                                // Update local state with the response data
                                                                setSelectedTask(prev => ({
                                                                  ...prev,
                                                                  assignedTo: [...prev.assignedTo, member]
                                                                }));
  
                                                                // Update the event's tasks array
                                                                setSelectedEvent(prev => ({
                                                                  ...prev,
                                                                  tasks: prev.tasks.map(t => 
                                                                    t.id === task.id 
                                                                      ? { ...t, assignedTo: [...t.assignedTo, member] }
                                                                      : t
                                                                  )
                                                                }));
  
                                                                dropdown.remove();
                                                              } catch (error) {
                                                                console.error('Failed to assign user:', error);
                                                                alert(error.message);
                                                              }
                                                            };
  
                                                            dropdown.appendChild(option);
                                                          });
  
                                                          // Position dropdown below the "Add" button
                                                          const rect = event.target.getBoundingClientRect();
                                                          dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
                                                          dropdown.style.left = `${rect.left + window.scrollX}px`;
  
                                                          // Add click outside handler
                                                          const handleClickOutside = (e) => {
                                                            if (!dropdown.contains(e.target) && e.target !== event.target) {
                                                              dropdown.remove();
                                                              document.removeEventListener('click', handleClickOutside);
                                                            }
                                                          };
  
                                                          document.addEventListener('click', handleClickOutside);
                                                          document.body.appendChild(dropdown);
                                                        }}
                                                        >
                                                          <div style={{display: "flex", alignItems: "center", gap: 8, justifyContent: "center"}}>
                                                            <img src="/icons/plus.svg" style={{width: 20, height: 20, opacity: 0.5}} />
                                                            <p style={{margin: 0, fontSize: 14, color: "#666"}}>Add team member</p>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <textarea
                                                        value={localDescription}
                                                        onChange={(e) => {
                                                          const newDescription = e.target.value;
                                                          setLocalDescription(newDescription);
                                                          setSelectedTask(prev => ({
                                                            ...prev,
                                                            description: newDescription
                                                          }));
                                                          setEditingTaskDescription(newDescription);
                                                        }}
                                                        onKeyDown={async (e) => {
                                                          if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            e.target.blur();
                                                          }
                                                        }}
                                                        onBlur={async () => {
                                                          if (localDescription !== task.description) {
                                                            try {
                                                              await handleTaskUpdate(task.id, { description: localDescription });
                                                            } catch (error) {
                                                              setLocalDescription(task.description || '');
                                                              setEditingTaskDescription(task.description || '');
                                                              setSelectedTask(prev => ({
                                                                ...prev,
                                                                description: task.description || ''
                                                              }));
                                                            }
                                                          }
                                                        }}
                                                        placeholder="Add a description..."
                                                        style={{
                                                          padding: "8px",
                                                          border: "1px solid #D0D7DE",
                                                          borderRadius: "8px",
                                                          fontWeight: "400",
                                                          minHeight: "80px",
                                                          resize: "vertical"
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
  
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
                    cursor: "text"
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