import React from 'react';

export default function VenueView({
  selectedEvent,
  selectedEventId,
  setSelectedEvent,
}) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      fontSize: "24px",
      width: "100%",
      justifyContent: "center"
    }}>
      <div style={{
        width: 800, 
        marginTop: 24
      }}>
        <div style={{
          display: "flex", 
          width: "100%", 
          alignItems: "center", 
          justifyContent: "space-between"
        }}>
          <p style={{margin: 0}}>Venue Blueprint (coming soon)</p>
        </div>
      </div>
    </div>
  );
} 