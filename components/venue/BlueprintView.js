import React from 'react';
import BuildingHeader from './BuildingHeader';
import RoomTable from './RoomTable';
import NoBlueprintView from './NoBlueprintView';

export default function BlueprintView({
  buildings,
  setBuildings,
  selectedEventId,
  setSelectedEvent,
  focusedCell,
  setFocusedCell
}) {
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
      const currentRoom = buildings
        .find(b => b.id === buildingId)
        ?.rooms.find(r => r.id === roomId);

      if (!currentRoom) return;

      await fetch('https://serenidad.click/hacktime/editRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          roomId: roomId,
          roomName: field === 'name' ? value : currentRoom.name,
          roomDescription: field === 'description' ? value : currentRoom.description
        }),
      });

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
    const buildingToDelete = buildings.find(b => b.id === buildingId);
    const confirmMessage = buildingToDelete.rooms.length > 0 
      ? `Are you sure you want to delete "${buildingToDelete.name || 'Untitled Building'}" and its ${buildingToDelete.rooms.length} room${buildingToDelete.rooms.length === 1 ? '' : 's'}?`
      : `Are you sure you want to delete "${buildingToDelete.name || 'Untitled Building'}"?`;

    if (!window.confirm(confirmMessage)) return;

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

      setBuildings(buildings.filter(building => building.id !== buildingId));
      setSelectedEvent(prev => ({
        ...prev,
        buildings: prev.buildings.filter(building => building.buildingId !== buildingId)
      }));
    } catch (error) {
      console.error('Failed to delete building:', error);
    }
  };

  if (buildings.length === 0) {
    return <NoBlueprintView onNewBuilding={handleNewBuilding} />;
  }

  return (
    <div style={{
      width: 800, 
      marginTop: 24
    }}>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {buildings.map(building => (
          <div key={building.id}>
            <BuildingHeader 
              building={building}
              onDeleteBuilding={handleDeleteBuilding}
              setSelectedEvent={setSelectedEvent}
            />
            <RoomTable
              building={building}
              onAddRoom={handleAddRoom}
              onDeleteRoom={handleDeleteRoom}
              onRoomChange={handleRoomChange}
              setFocusedCell={setFocusedCell}
              focusedCell={focusedCell}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 