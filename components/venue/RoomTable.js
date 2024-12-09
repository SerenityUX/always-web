import React from 'react';

export default function RoomTable({ 
  building, 
  onAddRoom, 
  onDeleteRoom, 
  onRoomChange,
  setFocusedCell,
  focusedCell 
}) {
  const handleCellKeyDown = (e, roomId, field) => {
    const roomIndex = building.rooms.findIndex(r => r.id === roomId);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (roomIndex < building.rooms.length - 1) {
          const nextRoom = building.rooms[roomIndex + 1];
          setFocusedCell({ buildingId: building.id, roomId: nextRoom.id, field });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (roomIndex > 0) {
          const prevRoom = building.rooms[roomIndex - 1];
          setFocusedCell({ buildingId: building.id, roomId: prevRoom.id, field });
        }
        break;
      case 'Tab':
        if (!e.shiftKey && field === 'name') {
          e.preventDefault();
          setFocusedCell({ buildingId: building.id, roomId, field: 'description' });
        } else if (e.shiftKey && field === 'description') {
          e.preventDefault();
          setFocusedCell({ buildingId: building.id, roomId, field: 'name' });
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (roomIndex === building.rooms.length - 1) {
          onAddRoom(building.id);
        } else {
          const nextRoom = building.rooms[roomIndex + 1];
          setFocusedCell({ buildingId: building.id, roomId: nextRoom.id, field });
        }
        break;
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <table style={{ 
        width: "100%", 
        borderCollapse: "collapse",
        fontSize: 14
      }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #EBEBEB" }}>
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
            <tr key={room.id} style={{
              borderBottom: "1px solid #EBEBEB",
              position: "relative"
            }}>
              <td style={{ 
                padding: "8px 0",
                borderRight: "1px solid #EBEBEB",
              }}>
                <input
                  data-building-id={building.id}
                  data-room-id={room.id}
                  data-field="name"
                  defaultValue={room.name || ''}
                  placeholder="Room Name"
                  onBlur={(e) => onRoomChange(building.id, room.id, 'name', e.target.value)}
                  onKeyDown={(e) => handleCellKeyDown(e, room.id, 'name')}
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
                    data-building-id={building.id}
                    data-room-id={room.id}
                    data-field="description"
                    defaultValue={room.description || ''}
                    placeholder="Optional Description"
                    onBlur={(e) => onRoomChange(building.id, room.id, 'description', e.target.value)}
                    onKeyDown={(e) => handleCellKeyDown(e, room.id, 'description')}
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
                    onClick={() => onDeleteRoom(building.id, room.id)}
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
          <tr style={{ borderBottom: "1px solid #EBEBEB" }}>
            <td 
              onClick={() => onAddRoom(building.id)}
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
  );
} 