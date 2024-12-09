import React from 'react';

export default function BuildingHeader({ building, onDeleteBuilding }) {
  const handleBuildingNameChange = async (e) => {
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
    } catch (error) {
      console.error('Failed to update building name:', error);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <input
        type="text"
        id={`building-${building.id}`}
        name={`building-${building.id}`}
        defaultValue={building.name || ''}
        placeholder="Building Name"
        onBlur={handleBuildingNameChange}
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
        onClick={() => onDeleteBuilding(building.id)}
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
} 