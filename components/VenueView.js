import React, { useState, useRef, useEffect } from 'react';

export default function VenueView({
  selectedEvent,
  selectedEventId,
  setSelectedEvent,
}) {
  const [buildings, setBuildings] = useState([]);
  const [lastAddedRoomId, setLastAddedRoomId] = useState(null);
  const [focusedCell, setFocusedCell] = useState(null); // { buildingId, roomId, field }
  const newBuildingInputRef = useRef(null);
  const newRoomInputRef = useRef(null);

  // Initialize buildings from selectedEvent
  useEffect(() => {
    if (selectedEvent?.buildings) {
      const formattedBuildings = selectedEvent.buildings.map(building => ({
        id: building.buildingId,
        name: building.buildingName,
        rooms: building.rooms.map(room => ({
          id: room.roomId,
          name: room.roomName,
          description: room.roomDescription
        }))
      }));
      setBuildings(formattedBuildings);
    }
  }, [selectedEvent?.buildings]);

  // Auto-focus new building input
  useEffect(() => {
    if (newBuildingInputRef.current) {
      newBuildingInputRef.current.focus();
    }
  }, [buildings.length]);

  // Auto-focus new room input
  useEffect(() => {
    if (newRoomInputRef.current && lastAddedRoomId) {
      newRoomInputRef.current.focus();
      setLastAddedRoomId(null); // Reset after focusing
    }
  }, [lastAddedRoomId]);

  const handleNewBuilding = async () => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/createBuilding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          eventId: selectedEventId,
          buildingName: ''
        }),
      });

      const data = await response.json();
      
      const newBuilding = {
        id: data.building_id,
        name: '',
        isNew: true,
        rooms: []
      };

      setBuildings([...buildings, newBuilding]);
      
      // Update parent state
      setSelectedEvent(prev => ({
        ...prev,
        buildings: [
          ...(prev.buildings || []),
          {
            buildingId: data.building_id,
            buildingName: '',
            rooms: []
          }
        ]
      }));
    } catch (error) {
      console.error('Failed to create building:', error);
    }
  };

  const handleAddRoom = async (buildingId) => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/createRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          buildingId: buildingId,
          roomName: '',
          roomDescription: ''
        }),
      });

      const data = await response.json();
      const newRoom = {
        id: data.room_id,
        name: '',
        description: '',
        isEditing: true
      };

      const updatedBuildings = buildings.map(building => {
        if (building.id === buildingId) {
          return {
            ...building,
            rooms: [...building.rooms, newRoom]
          };
        }
        return building;
      });
      
      setBuildings(updatedBuildings);
      setLastAddedRoomId(data.room_id);

      // Update parent state
      setSelectedEvent(prev => ({
        ...prev,
        buildings: prev.buildings.map(building => {
          if (building.buildingId === buildingId) {
            return {
              ...building,
              rooms: [
                ...building.rooms,
                {
                  roomId: data.room_id,
                  roomName: '',
                  roomDescription: ''
                }
              ]
            };
          }
          return building;
        })
      }));
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleRoomChange = async (buildingId, roomId, field, value) => {
    // Update local state immediately for responsiveness
    const updatedBuildings = buildings.map(building => {
      if (building.id === buildingId) {
        const updatedRooms = building.rooms.map(room => {
          if (room.id === roomId) {
            return { ...room, [field]: value };
          }
          return room;
        });
        return { ...building, rooms: updatedRooms };
      }
      return building;
    });
    setBuildings(updatedBuildings);

    try {
      await fetch('https://serenidad.click/hacktime/editRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          roomId: roomId,
          roomName: field === 'name' ? value : undefined,
          roomDescription: field === 'description' ? value : undefined
        }),
      });

      // Update parent state
      setSelectedEvent(prev => ({
        ...prev,
        buildings: prev.buildings.map(building => {
          if (building.buildingId === buildingId) {
            return {
              ...building,
              rooms: building.rooms.map(room => {
                if (room.roomId === roomId) {
                  return {
                    ...room,
                    roomName: field === 'name' ? value : room.roomName,
                    roomDescription: field === 'description' ? value : room.roomDescription
                  };
                }
                return room;
              })
            };
          }
          return building;
        })
      }));
    } catch (error) {
      console.error('Failed to update room:', error);
    }
  };

  const handleTitleChange = (e, buildingId) => {
    const value = e.target.value;
    setBuildings(prevBuildings => 
      prevBuildings.map(building => 
        building.id === buildingId 
          ? { ...building, name: value }
          : building
      )
    );
  };

  const handleTitleBlur = async (e, buildingId) => {
    const value = e.target.value;
    try {
      await fetch('https://serenidad.click/hacktime/editBuilding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          buildingId: buildingId,
          buildingName: value
        }),
      });

      // Update parent state
      setSelectedEvent(prev => ({
        ...prev,
        buildings: prev.buildings.map(building => {
          if (building.buildingId === buildingId) {
            return {
              ...building,
              buildingName: value
            };
          }
          return building;
        })
      }));
    } catch (error) {
      console.error('Failed to update building name:', error);
    }
  };

  const handleKeyDown = (e, buildingId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const updatedBuildings = buildings.map(building => {
        if (building.id === buildingId) {
          return {
            ...building,
            isNew: false
          };
        }
        return building;
      });
      setBuildings(updatedBuildings);
    }
  };

  const handleCellKeyDown = (e, buildingId, roomId, field) => {
    const building = buildings.find(b => b.id === buildingId);
    const roomIndex = building.rooms.findIndex(r => r.id === roomId);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (roomIndex < building.rooms.length - 1) {
          // Move to next room, same field
          const nextRoom = building.rooms[roomIndex + 1];
          setFocusedCell({ buildingId, roomId: nextRoom.id, field });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (roomIndex > 0) {
          // Move to previous room, same field
          const prevRoom = building.rooms[roomIndex - 1];
          setFocusedCell({ buildingId, roomId: prevRoom.id, field });
        }
        break;
      case 'ArrowRight':
        if (field === 'name' && e.target.selectionStart === e.target.value.length) {
          e.preventDefault();
          setFocusedCell({ buildingId, roomId, field: 'description' });
        }
        break;
      case 'ArrowLeft':
        if (field === 'description' && e.target.selectionStart === 0) {
          e.preventDefault();
          setFocusedCell({ buildingId, roomId, field: 'name' });
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (roomIndex < building.rooms.length - 1) {
          // Move to next room
          const nextRoom = building.rooms[roomIndex + 1];
          setFocusedCell({ buildingId, roomId: nextRoom.id, field });
        } else {
          // Create new row and focus it
          handleAddRoom(buildingId);
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (field === 'name') {
          // Move to description field
          setFocusedCell({ buildingId, roomId, field: 'description' });
        } else if (roomIndex < building.rooms.length - 1) {
          // Move to next room's name field
          const nextRoom = building.rooms[roomIndex + 1];
          setFocusedCell({ buildingId, roomId: nextRoom.id, field: 'name' });
        } else {
          // Create new row and focus its name field
          handleAddRoom(buildingId);
        }
        break;
    }
  };

  const handleDeleteRoom = async (buildingId, roomId) => {
    try {
      await fetch('https://serenidad.click/hacktime/deleteRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          roomId: roomId
        }),
      });

      // Update local state
      const updatedBuildings = buildings.map(building => {
        if (building.id === buildingId) {
          return {
            ...building,
            rooms: building.rooms.filter(room => room.id !== roomId)
          };
        }
        return building;
      });
      setBuildings(updatedBuildings);

      // Update parent state
      setSelectedEvent(prev => ({
        ...prev,
        buildings: prev.buildings.map(building => {
          if (building.buildingId === buildingId) {
            return {
              ...building,
              rooms: building.rooms.filter(room => room.roomId !== roomId)
            };
          }
          return building;
        })
      }));
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  const handleDeleteBuilding = async (buildingId) => {
    // Show confirmation dialog
    const buildingToDelete = buildings.find(b => b.id === buildingId);
    const confirmMessage = buildingToDelete.rooms.length > 0 
      ? `Are you sure you want to delete "${buildingToDelete.name || 'Untitled Building'}" and its ${buildingToDelete.rooms.length} room${buildingToDelete.rooms.length === 1 ? '' : 's'}?`
      : `Are you sure you want to delete "${buildingToDelete.name || 'Untitled Building'}"?`;

    if (!window.confirm(confirmMessage)) {
      return; // Exit if user cancels
    }

    try {
      await fetch('https://serenidad.click/hacktime/deleteBuilding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          buildingId: buildingId
        }),
      });

      // Update local state
      setBuildings(buildings.filter(building => building.id !== buildingId));

      // Update parent state
      setSelectedEvent(prev => ({
        ...prev,
        buildings: prev.buildings.filter(building => building.buildingId !== buildingId)
      }));
    } catch (error) {
      console.error('Failed to delete building:', error);
    }
  };

  // Effect to focus cells when focusedCell changes
  useEffect(() => {
    if (focusedCell) {
      const input = document.querySelector(
        `[data-building-id="${focusedCell.buildingId}"][data-room-id="${focusedCell.roomId}"][data-field="${focusedCell.field}"]`
      );
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [focusedCell]);

  const BuildingHeader = ({ building }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <input
        type="text"
        id={`building-${building.id}`}
        name={`building-${building.id}`}
        defaultValue={building.name || ''}
        placeholder="Building Name"
        onBlur={async (e) => {
          try {
            await fetch('https://serenidad.click/hacktime/editBuilding', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: localStorage.getItem('token'),
                buildingId: building.id,
                buildingName: e.target.value
              }),
            });

            setSelectedEvent(prev => ({
              ...prev,
              buildings: prev.buildings.map(b => 
                b.buildingId === building.id 
                  ? { ...b, buildingName: e.target.value }
                  : b
              )
            }));
          } catch (error) {
            console.error('Failed to update building name:', error);
          }
        }}
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: "normal",
          color: "#000",
          outline: "none",
          border: "none",
          padding: 0,
          width: "100%",
          background: "transparent"
        }}
      />
      <button
        onClick={() => handleDeleteBuilding(building.id)}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px 8px',
          cursor: 'pointer'
        }}
      >
        <img 
          src="/icons/trash.svg" 
          alt="Delete building"
          style={{
            width: 16,
            height: 16
          }}
        />
      </button>
    </div>
  );

  return (
    <div style={{
      flex: 1,
      display: "flex",
      fontSize: "20px",
      width: "100%",
      justifyContent: "center"
    }}>
      <div style={{
        width: 800, 
        marginTop: 24
      }}>
        {buildings.length > 0 && (
          <div style={{
            display: "flex", 
            width: "100%", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: 24
          }}>
            <p style={{margin: 0, fontSize: 24}}>Venue Blueprint</p>
            <button
              onClick={handleNewBuilding}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14
              }}
            >
              New Building
            </button>
          </div>
        )}

        {/* Show welcome message when no buildings exist */}
        {buildings.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            marginTop: 64,
            textAlign: "center"
          }}>
            <img 
              src="/cute-cat.gif" 
              alt="Venue"
              style={{
                width: 256,
                height: 256,
                opacity: 0.8
              }}
            />
            <div style={{maxWidth: 450}}>
              <p style={{
                fontSize: 24,
                margin: "0 0 16px 0"
              }}>
                No buildings to blueprint...
              </p>
              <p style={{
                fontSize: 16,
                color: "#666",
                margin: 0,
                lineHeight: "24px"
              }}>
                optionally map out your event venue to tie your tasks to specific buildings & rooms
              </p>
            </div>
            <button
              onClick={handleNewBuilding}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16
              }}
            >
              Add Your First Building
            </button>
          </div>
        ) : (
          // Existing buildings list code
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {buildings.map(building => (
              <div key={building.id}>
                <BuildingHeader building={building} />

                {/* Rooms Table */}
                <div style={{ marginTop: 8 }}>
                  <table style={{ 
                    width: "100%", 
                    borderCollapse: "collapse",
                    fontSize: 14
                  }}>
                    <thead>
                      <tr style={{
                        borderBottom: "1px solid #EBEBEB"
                      }}>
                        <th style={{ 
                          textAlign: "left", 
                          fontWeight: "normal",
                          color: "#666",
                          padding: "8px 0",
                          width: "25%",
                          borderRight: "1px solid #EBEBEB"
                        }}>
                          room name
                        </th>
                        <th style={{ 
                          textAlign: "left", 
                          fontWeight: "normal",
                          color: "#666",
                          padding: "8px 0 8px 16px",
                          width: "75%"
                        }}>
                          room description (optional)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {building.rooms.map((room) => (
                        <tr 
                          key={room.id} 
                          style={{
                            borderBottom: "1px solid #EBEBEB",
                            position: "relative",
                            "&:hover .trash-icon": {
                              opacity: 1
                            }
                          }}
                        >
                          <td style={{ 
                            padding: "8px 0",
                            borderRight: "1px solid #EBEBEB",
                          }}>
                            <input
                              id={`room-${room.id}-name`}
                              name={`room-${room.id}-name`}
                              defaultValue={room.name || ''}
                              placeholder="Room Name"
                              onBlur={async (e) => {
                                try {
                                  await fetch('https://serenidad.click/hacktime/editRoom', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      token: localStorage.getItem('token'),
                                      roomId: room.id,
                                      roomName: e.target.value,
                                      roomDescription: room.description
                                    }),
                                  });

                                  setSelectedEvent(prev => ({
                                    ...prev,
                                    buildings: prev.buildings.map(b => {
                                      if (b.buildingId === building.id) {
                                        return {
                                          ...b,
                                          rooms: b.rooms.map(r => {
                                            if (r.roomId === room.id) {
                                              return {
                                                ...r,
                                                roomName: e.target.value
                                              };
                                            }
                                            return r;
                                          })
                                        };
                                      }
                                      return b;
                                    })
                                  }));
                                } catch (error) {
                                  console.error('Failed to update room:', error);
                                }
                              }}
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: 14,
                                background: "transparent"
                              }}
                            />
                          </td>
                          <td style={{ 
                            padding: "8px 0 8px 16px",
                            position: "relative"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                              <input
                                id={`room-${room.id}-description`}
                                name={`room-${room.id}-description`}
                                defaultValue={room.description || ''}
                                placeholder="Optional Description"
                                onBlur={async (e) => {
                                  try {
                                    await fetch('https://serenidad.click/hacktime/editRoom', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        token: localStorage.getItem('token'),
                                        roomId: room.id,
                                        roomName: room.name,
                                        roomDescription: e.target.value
                                      }),
                                    });

                                    setSelectedEvent(prev => ({
                                      ...prev,
                                      buildings: prev.buildings.map(b => {
                                        if (b.buildingId === building.id) {
                                          return {
                                            ...b,
                                            rooms: b.rooms.map(r => {
                                              if (r.roomId === room.id) {
                                                return {
                                                  ...r,
                                                  roomDescription: e.target.value
                                                };
                                              }
                                              return r;
                                            })
                                          };
                                        }
                                        return b;
                                      })
                                    }));
                                  } catch (error) {
                                    console.error('Failed to update room:', error);
                                  }
                                }}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  fontSize: 14,
                                  background: "transparent"
                                }}
                              />
                              <div 
                                className="trash-icon"
                                onClick={() => handleDeleteRoom(building.id, room.id)}
                                style={{
                                  marginLeft: 8,
                                  opacity: 0,
                                  transition: "opacity 0.2s ease-in-out",
                                  cursor: "pointer",
                                  padding: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                <img 
                                  src="/icons/trash.svg" 
                                  alt="Delete room"
                                  style={{
                                    width: 16,
                                    height: 16
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr style={{
                        borderBottom: "1px solid #EBEBEB"
                      }}>
                        <td 
                          onClick={() => handleAddRoom(building.id)}
                          style={{ 
                            color: "#666",
                            padding: "8px 0",
                            cursor: "pointer",
                            borderRight: "1px solid #EBEBEB"
                          }}
                        >
                          + add room
                        </td>
                        <td style={{ 
                          color: "#666",
                          padding: "8px 0 8px 16px"
                        }}>
                          optional description
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 