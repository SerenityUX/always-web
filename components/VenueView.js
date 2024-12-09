import React, { useState, useEffect } from 'react';
import BlueprintView from './venue/BlueprintView';

export default function VenueView({
  selectedEvent,
  selectedEventId,
  setSelectedEvent,
}) {
  const [buildings, setBuildings] = useState([]);
  const [focusedCell, setFocusedCell] = useState(null);

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

  return (
    <div style={{
      flex: 1,
      display: "flex",
      fontSize: "20px",
      width: "100%",
      justifyContent: "center",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* <div style={{fontSize: 16, width: 700,}}>
        <p style={{margin: 0}}>discovery</p>
        <p style={{margin: 0}}>outreach</p>
        <p style={{margin: 0}}>blueprint</p>
      </div> */}
      <BlueprintView
        buildings={buildings}
        setBuildings={setBuildings}
        selectedEventId={selectedEventId}
        setSelectedEvent={setSelectedEvent}
        focusedCell={focusedCell}
        setFocusedCell={setFocusedCell}
      />
    </div>
  );
} 