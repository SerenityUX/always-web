import CustomDateTimeSelect from './CustomDateTimeSelect';
import { useState } from 'react';

const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
export const editTaskModal = (user, handleDeleteTask, task, titleInputRef, localTitle, setLocalTitle, setSelectedTask, setEditingTaskTitle, handleTaskUpdate, formattedStartTime, taskStart, taskEnd, formattedEndTime, setSelectedEvent, dropdownTriggerRef, selectedEvent, localDescription, setLocalDescription, setEditingTaskDescription, isNoteFocused, setIsNoteFocused) => {
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
        <div style={{ display: "flex", fontSize: 14, justifyContent: "space-between", gap: 8, flexDirection: "row" }}>
          <div style={{
            width: "100%", 
            display: "flex", 
            flexDirection: "column", 
            gap: 8
          }}>
            <div style={{
              padding: 6, 
              cursor: "pointer", 
              border: "1px solid #EBEBEB", 
              borderRadius: 8, 
              display: "flex", 
              flexDirection: "column",
              justifyContent: "space-between",
              height: selectedEvent?.buildings?.length > 0 && selectedEvent.buildings.some(b => b.rooms.length > 0) ? 'auto' : '100%'
            }}
            onClick={(event) => {
              event.stopPropagation();

              // Get all team members and add current user if not already in list
              let allMembers = [...selectedEvent.teamMembers];
              if (user && !allMembers.some(member => member.email === user.email)) {
                allMembers.unshift({
                  email: user.email,
                  name: user.name,
                  profilePicture: user.profile_picture_url
                });
              }

              // Split into assigned and unassigned members
              const assignedMembers = allMembers.filter(member => 
                task?.assignedTo?.some(assigned => assigned.email === member.email)
              );
              const unassignedMembers = allMembers.filter(member => 
                !task?.assignedTo?.some(assigned => assigned.email === member.email)
              );

              // Create and show dropdown
              const dropdown = document.createElement('div');
              dropdown.style.position = 'absolute';
              dropdown.style.backgroundColor = '#fff';
              dropdown.style.border = '1px solid #D0D7DE';
              dropdown.style.borderRadius = '8px';
              dropdown.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              dropdown.style.maxHeight = '300px';
              dropdown.style.overflowY = 'auto';
              dropdown.style.width = '268px';
              dropdown.style.zIndex = '1000';

              // Helper function to create member option
              const createMemberOption = (member, isAssigned) => {
                const option = document.createElement('div');
                option.style.padding = '8px';
                option.style.display = 'flex';
                option.style.alignItems = 'center';
                option.style.gap = '8px';
                option.style.cursor = 'pointer';
                option.style.transition = 'all 0.2s';
                option.style.backgroundColor = isAssigned ? '#F6F8FA' : 'transparent';
                option.style.borderLeft = `4px solid ${isAssigned ? '#D73A49' : 'transparent'}`;

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
                avatar.style.color = '#fff';
                avatar.style.fontSize = '12px';
                avatar.style.fontWeight = '500';

                if (!member.profilePicture) {
                  avatar.textContent = getInitials(member.name);
                }

                const info = document.createElement('div');
                info.style.flex = '1';
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
                    if (isAssigned) {
                      // Unassign user
                      const response = await fetch('https://serenidad.click/hacktime/unassignEventTask', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          token: localStorage.getItem('token'),
                          taskId: task.id,
                          userEmailToRemove: member.email
                        }),
                      });

                      const data = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(data.error || 'Failed to unassign user');
                      }

                      // Update local state to remove the user
                      setSelectedTask(prev => ({
                        ...prev,
                        assignedTo: prev.assignedTo.filter(a => a.email !== member.email)
                      }));

                      setSelectedEvent(prev => ({
                        ...prev,
                        tasks: prev.tasks.map(t => 
                          t.id === task.id 
                            ? { ...t, assignedTo: t.assignedTo.filter(a => a.email !== member.email) }
                            : t
                        )
                      }));

                    } else {
                      // Assign user
                      const response = await fetch('https://serenidad.click/hacktime/assignEventTask', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          token: localStorage.getItem('token'),
                          eventId: selectedEvent.id,
                          taskId: task.id,
                          assigneeEmail: member.email
                        }),
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.error || 'Failed to assign user');
                      }

                      // Update local state to add the user
                      setSelectedTask(prev => ({
                        ...prev,
                        assignedTo: [...prev.assignedTo, member]
                      }));

                      setSelectedEvent(prev => ({
                        ...prev,
                        tasks: prev.tasks.map(t => 
                          t.id === task.id 
                            ? { ...t, assignedTo: [...t.assignedTo, member] }
                            : t
                        )
                      }));
                    }

                    // Just remove the dropdown without trying to reopen it
                    dropdown.remove();
                    
                  } catch (error) {
                    console.error('Failed to update assignment:', error);
                    alert(error.message);
                  }
                };

                dropdown.appendChild(option);
              };

              // Add assigned members
              assignedMembers.forEach(member => createMemberOption(member, true));

              // Add unassigned members
              unassignedMembers.forEach(member => createMemberOption(member, false));

              // Position dropdown below the assignees section
              const rect = event.currentTarget.getBoundingClientRect();
              dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
              dropdown.style.left = `${rect.left + window.scrollX}px`;

              // Add click outside handler
              const handleClickOutside = (e) => {
                if (!dropdown.contains(e.target) && e.target !== event.currentTarget) {
                  dropdown.remove();
                  document.removeEventListener('click', handleClickOutside);
                }
              };

              document.addEventListener('click', handleClickOutside);
              document.body.appendChild(dropdown);
            }}>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {task.assignedTo.slice(0, 4).map((person, index) => (
                    <div key={index} style={{
                      marginLeft: index === 0 ? 0 : "-8px",
                      display: "flex",
                      alignItems: "center",
                    }}>
                      <div style={{
                        backgroundColor: "#666",
                        backgroundImage: person.profilePicture ? `url(${person.profilePicture})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        height: 24,
                        width: 24,
                        borderRadius: "50%",
                        border: "1px solid #fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: "500",
                        zIndex: task.assignedTo.length - index
                      }}>
                        {!person.profilePicture && getInitials(person.name)}
                      </div>
                    </div>
                  ))}
                  {task.assignedTo.length > 4 && (
                    <div style={{
                      marginLeft: "-8px",
                      backgroundColor: "#666",
                      height: 24,
                      width: 24,
                      borderRadius: "50%",
                      border: "1px solid #fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "500",
                      zIndex: 0
                    }}>
                      +{task.assignedTo.length - 4}
                    </div>
                  )}
                </div>
                <p style={{margin: 0, fontSize: 10}}>({task.assignedTo.length})</p>
              </div>           
              <p style={{margin: 0}}>Assignees</p>
            </div>
            {selectedEvent?.buildings?.length > 0 && selectedEvent.buildings.some(b => b.rooms.length > 0) && (
              <div style={{
                padding: "8px", 
                cursor: "pointer", 
                border: "1px solid #EBEBEB", 
                borderRadius: 8,
                fontSize: 14
              }}>
                <select
                  value={task.location || ""}
                  onChange={async (e) => {
                    const locationId = e.target.value || null;
                    
                    try {
                      await handleTaskUpdate(task.id, {
                        location: locationId
                      });

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
                    width: "100%",
                    backgroundColor: "transparent",
                    fontSize: 12,
                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: "url('./icons/chevron-down.svg')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 4px center",
                    backgroundSize: "12px",
                    paddingRight: "20px"
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
          </div>
          <div style={{
            width: "100%", 
            display: 'flex', 
            flexDirection: "column", 
            borderRadius: isNoteFocused ? 8 : 4, 
            overflow: "hidden", 
            padding: 0, 
            border: "1px solid #EBEBEB",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: isNoteFocused ? "absolute" : "relative",
            top: isNoteFocused ? "0" : "auto",
            left: isNoteFocused ? "0" : "auto",
            right: isNoteFocused ? "0" : "auto",
            bottom: isNoteFocused ? "0" : "auto",
            zIndex: isNoteFocused ? "1000" : "1",
            backgroundColor: "#fff",
            height: isNoteFocused ? "100%" : "auto",
            transform: isNoteFocused ? "none" : "scale(1)",
            opacity: 1,
          }}>
            <div style={{
              backgroundColor: "#FFFADD", 
              borderBottom: "1px solid #EBEBEB", 
              padding: isNoteFocused ? "8px" : "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isNoteFocused && (
                  <img 
                    src="/minimize.svg" 
                    style={{
                      height: "20px",
                      width: "20px",
                      cursor: "pointer"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      document.activeElement.blur();
                    }}
                  />
                )}
                <p style={{
                  margin: 0, 
                  color: "#5D3C0A",
                  fontSize: isNoteFocused ? "18px" : "14px",
                  fontWeight: isNoteFocused ? "500" : "normal",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}>Note Pad</p>
              </div>
              <img style={{
                height: isNoteFocused ? "16px" : "12px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }} src="./NotepadIcons.svg"/>
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
              }}
              onFocus={() => setIsNoteFocused(true)}
              onBlur={async () => {
                setIsNoteFocused(false);
                try {
                  await handleTaskUpdate(task.id, { description: localDescription });
                } catch (error) {
                  // Revert to original description if save fails
                  setLocalDescription(task.description || '');
                  setSelectedTask(prev => ({
                    ...prev,
                    description: task.description || ''
                  }));
                }
              }}
              placeholder="Add a note..."
              style={{
                padding: isNoteFocused ? "8px" : "8px",
                border: "none",
                outline: "none",
                fontFamily: "inherit",
                fontSize: isNoteFocused ? "16px" : "14px",
                lineHeight: "1.5",
                resize: "none",
                flex: 1,
                minHeight: isNoteFocused ? "calc(100% - 60px)" : "60px",
                backgroundColor: "#fff",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            />
          </div>
          {isNoteFocused && (
            <div 
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.0)",
                zIndex: 999,
                opacity: 1,
                transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onClick={() => {
                document.activeElement.blur();
              }}
            />
          )}
        </div>
      </div>
    </div>;
  }