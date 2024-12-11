import React, { useState, useEffect } from 'react';
import BlueprintView from './venue/BlueprintView';
import TabSelector from './TabSelector';
import VenueSearch from './venue/VenueSearch';
import OutreachTable from './venue/OutreachTable';

export default function VenueView({
  selectedEvent,
  selectedEventId,
  setSelectedEvent,
  user,
  venues,
  setVenues,
  addedToOutreach,
  handleVenueOutreach,
  venueSearchState,
  setVenueSearchState,
  venueTypeOptions
}) {
  const [buildings, setBuildings] = useState([]);
  const [focusedCell, setFocusedCell] = useState(null);
  const [mode, setMode] = useState(null);
  const [streamedVenues, setStreamedVenues] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize buildings from selectedEvent and set initial mode
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
      // Set mode to 'blueprint' if there are buildings, 'discovery' if not
      setMode(formattedBuildings.length > 0 ? 'blueprint' : 'discovery');
    } else {
      setMode('discovery');
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
      <TabSelector
        options={['discovery', 'outreach', 'blueprint']}
        value={mode}
        onChange={setMode}
        initialValue={mode}
        style={{ marginTop: 16 }}
      />
      {mode == "discovery" && 
        <VenueSearch 
          eventId={selectedEventId}
          venues={streamedVenues}
          setVenues={setStreamedVenues}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          selectedEventId={selectedEventId}
          venueSearchState={venueSearchState}
          setVenueSearchState={setVenueSearchState}
          venueTypeOptions={venueTypeOptions}
          isStreaming={isStreaming}
          setIsStreaming={setIsStreaming}
        />
      }
      {mode == "outreach" && 
        <OutreachTable 
        user={user} // Pass the user object from your auth state
          venues={selectedEvent?.venueOutreach || []}
          onSendEmail={(venue) => {
            console.log('Sending email to venue:', venue);
          }}
          onDeleteOutreach={async (venue) => {
            if (window.confirm(`Are you sure you want to remove ${venue.name} from outreach?`)) {
              try {
                const response = await fetch('https://serenidad.click/hacktime/removeOutreach', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: localStorage.getItem('token'),
                    outreachId: venue.id
                  })
                });

                if (response.ok) {
                  setSelectedEvent(prev => ({
                    ...prev,
                    venueOutreach: prev.venueOutreach.filter(v => v.id !== venue.id)
                  }));
                }
              } catch (error) {
                console.error('Error removing outreach:', error);
              }
            }
          }}
        />
      }
      {mode == "blueprint" &&
        <BlueprintView
          buildings={buildings}
          setBuildings={setBuildings}
          selectedEventId={selectedEventId}
          setSelectedEvent={setSelectedEvent}
          focusedCell={focusedCell}
          setFocusedCell={setFocusedCell}
        />
      }
    </div>
  );
} 