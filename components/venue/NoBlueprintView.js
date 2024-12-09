import React from 'react';

export default function NoBlueprintView({ onNewBuilding }) {
  return (
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
        onClick={onNewBuilding}
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
  );
} 