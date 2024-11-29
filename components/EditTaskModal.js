import CustomDateTimeSelect from './CustomDateTimeSelect';

const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
export const editTaskModal = (user, handleDeleteTask, task, titleInputRef, localTitle, setLocalTitle, setSelectedTask, setEditingTaskTitle, handleTaskUpdate, formattedStartTime, taskStart, taskEnd, formattedEndTime, setSelectedEvent, dropdownTriggerRef, selectedEvent, localDescription, setLocalDescription, setEditingTaskDescription) => {
    return <div style={{ position: "absolute", fontSize: "16", cursor: "auto", top: 16, left: 228, borderRadius: 8, width: 300, backgroundColor: "#fff" }}>
      <div style={{ width: "calc(100% - 24px)", borderRadius: "16px 16px 0px 0px", paddingTop: 8, paddingBottom: 8, justifyContent: "space-between", paddingLeft: 16, paddingRight: 8, alignItems: "center", display: "flex", backgroundColor: "#F6F8FA" }}>
        <p onClick={() => console.log(user)} style={{ margin: 0, fontSize: 14 }}>Edit Task</p>
        <img
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this task?')) {
              handleDeleteTask(task.id);
            }
          } }
          style={{ width: 24, height: 24, cursor: "pointer" }}
          src="/icons/trash.svg" />
      </div>
      <div style={{ display: "flex", gap: 16, padding: 16, flexDirection: "column" }}>
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
          } }
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.target.blur();
            }
          } }
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
          } }
          style={{
            margin: 0,
            fontSize: 24,
            cursor: "text",
            color: "#000",
            outline: "1px solid rgb(235, 235, 235)",
            padding: "2px 4px",
            borderRadius: "4px",
            border: "1px solid transparent",
            transition: "border-color 0.2s"
          }} />
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
                    value={taskStart}
                    
                    onChange={async (date) => {
                      const newStartTime = new Date(taskStart);
                      newStartTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
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
                    type="date"
                  />
                  <CustomDateTimeSelect
                    value={taskStart}
                    width={70}
                    onChange={async (newStartTime) => {
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
                    type="time"
                  />
                </div>
              </div>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexDirection: "row"}}>
                <p style={{margin: 0, fontSize: 16, paddingTop: 0, paddingBottom: 0, fontSize: 16, lineHeight: 1}}>End</p>
                <div style={{display: 'flex', flexDirection: "row", gap: 4}}>
                  <CustomDateTimeSelect
                    value={taskEnd}
                    
                    onChange={async (date) => {
                      const newEndTime = new Date(taskEnd);
                      newEndTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      
                      try {
                        await handleTaskUpdate(task.id, {
                          startTime: taskStart.toISOString(),
                          endTime: newEndTime.toISOString()
                        });
                      } catch (error) {
                        console.error('Failed to update task times:', error);
                      }
                    }}
                    type="date"
                  />
                  <CustomDateTimeSelect
                    value={taskEnd}
                    width={70}

                    onChange={async (newEndTime) => {
                      if (newEndTime < taskStart) {
                        const nextDayEndTime = new Date(newEndTime.getTime() + 24 * 60 * 60 * 1000);
                        const duration = nextDayEndTime - taskStart;

                        if (duration <= MAX_DURATION) {
                          newEndTime = nextDayEndTime;
                        } else {
                          return; // Don't allow the change if it would exceed max duration
                        }
                      }

                      try {
                        await handleTaskUpdate(task.id, {
                          startTime: taskStart.toISOString(),
                          endTime: newEndTime.toISOString()
                        });
                      } catch (error) {
                        console.error('Failed to update task times:', error);
                      }
                    }}
                    type="time"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {selectedEvent?.buildings?.length > 0 && selectedEvent.buildings.some(b => b.rooms.length > 0) && (
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
              value={task.location || ""}
              onChange={async (e) => {
                const locationId = e.target.value || null;
                
                try {
                  const response = await handleTaskUpdate(task.id, {
                    location: locationId
                  });

                  // Update local state
                  setSelectedTask(prev => ({
                    ...prev,
                    location: locationId
                  }));

                  setSelectedEvent(prev => ({
                    ...prev,
                    tasks: prev.tasks.map(t => 
                      t.id === task.id 
                        ? { ...t, location: locationId }
                        : t
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Assigned To</p>
  
          {/* List current assignments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
  
                        // console.log(task.id, person.email)
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
                          tasks: prev.tasks.map(t => t.id === task.id ? { ...t, assignedTo: updatedTask.assignedTo } : t
                          )
                        }));
                      } catch (error) {
                        console.error('Failed to unassign user:', error);
                        alert('Failed to unassign user');
                      }
                    }
                  } }
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
                  onMouseOut={e => e.target.style.opacity = 0.5} />
              </div>
            ))}
          </div>
  
          {/* Add new assignment */}
          <div
            ref={dropdownTriggerRef}
            style={{
              padding: "8px",
              border: "1px dashed #666",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.2s",
              position: "relative"
            }}
            onClick={(event) => {
              event.stopPropagation();
  
              // Get trigger element position
              const triggerElement = event.currentTarget;
              const triggerRect = triggerElement.getBoundingClientRect();
  
              // Show dropdown of available team members
              const availableMembers = selectedEvent.teamMembers
                .filter(member => !task?.assignedTo?.some(assigned => assigned.email === member.email));
  
              // Always add current user if not already assigned
              if (user && !task?.assignedTo?.some(assigned => assigned.email === user.email)) {
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
                      tasks: prev.tasks.map(t => t.id === task.id
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
            } }
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <img src="/icons/plus.svg" style={{ width: 20, height: 20, opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Add team member</p>
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
          } }
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.target.blur();
            }
          } }
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
          } }
          placeholder="Add a note..."
          style={{
            padding: "8px",
            border: "1px solid #D0D7DE",
            borderRadius: "8px",
            fontWeight: "400",
            minHeight: "80px",
            resize: "vertical"
          }} />
      </div>
    </div>;
  }