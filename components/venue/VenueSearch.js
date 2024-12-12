import React, { useState, useEffect, useRef } from 'react';

export default function VenueSearch({ 
  eventId, 
  venues, 
  setVenues, 
  selectedEvent,
  setSelectedEvent,
  selectedEventId,
  venueSearchState,
  setVenueSearchState,
  venueTypeOptions,
  isStreaming,
  setIsStreaming
}) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastLeaving, setIsToastLeaving] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isHoveringGenerate, setIsHoveringGenerate] = useState(false);
  const tagsContainerRef = useRef(null);
  const streamParser = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (venueSearchState.isVenueDropdownOpen && !event.target.closest('.venue-dropdown')) {
        setVenueSearchState(prev => ({ ...prev, isVenueDropdownOpen: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [venueSearchState.isVenueDropdownOpen]);

  useEffect(() => {
    if (tagsContainerRef.current) {
      setVenueSearchState(prev => ({
        ...prev,
        needsPadding: tagsContainerRef.current.offsetHeight > 24
      }));
    }
  }, [venueSearchState.selectedVenueTypes]);

  useEffect(() => {
    console.log('Search venues:', venues);
    console.log('Outreach venues:', selectedEvent?.venueOutreach);
  }, [venues, selectedEvent]);

  useEffect(() => {
    if (selectedEventId) {
      const savedCity = localStorage.getItem(`lastSearchCity_${selectedEventId}`);
      const savedPrompt = localStorage.getItem(`lastSearchPrompt_${selectedEventId}`);
      const savedVenueTypes = localStorage.getItem(`lastVenueTypes_${selectedEventId}`);
      
      if (savedCity || savedPrompt || savedVenueTypes) {
        setVenueSearchState(prev => ({
          ...prev,
          userCity: savedCity || prev.userCity,
          searchText: savedPrompt || prev.searchText,
          selectedVenueTypes: savedVenueTypes ? JSON.parse(savedVenueTypes) : prev.selectedVenueTypes
        }));
      }
    }
  }, [selectedEventId]);

  const handleVenueOutreach = async (venue) => {
    if (!selectedEvent) {
      console.error('No event selected');
      return 'Error: No event selected';
    }

    const isAlreadyAdded = selectedEvent.venueOutreach?.some(v => 
      getVenueIdentifier(v) === getVenueIdentifier(venue)
    );

    if (isAlreadyAdded) {
      // Find the outreach entry to remove
      const outreachToRemove = selectedEvent.venueOutreach.find(v => 
        getVenueIdentifier(v) === getVenueIdentifier(venue)
      );

      if (!outreachToRemove?.id) {
        console.error('Could not find outreach to remove');
        return 'Error: Could not find outreach to remove';
      }

      try {
        const response = await fetch('https://serenidad.click/hacktime/removeOutreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: localStorage.getItem('token'),
            outreachId: outreachToRemove.id
          })
        });

        if (response.ok) {
          setSelectedEvent(prev => ({
            ...prev,
            venueOutreach: prev.venueOutreach.filter(v => getVenueIdentifier(v) !== getVenueIdentifier(venue))
          }));
          return 'Removed from outreach list';
        }
      } catch (error) {
        console.error('Error removing outreach:', error);
        return 'Failed to remove from outreach list';
      }
    } else {
      try {
        console.log('Adding venue:', venue); // Debug log

        const response = await fetch('https://serenidad.click/hacktime/createOutreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: localStorage.getItem('token'),
            eventId: selectedEvent.id,
            name: venue.name,
            location: venue.address,
            oneLiner: venue.oneLiner,
            photo: "not yet",
            website: venue.website,
            email: venue.emails?.join(',') || '',
            phoneNumber: venue.phone || ''
          })
        });

        if (response.ok) {
          const newOutreach = await response.json();
          console.log('Server response:', newOutreach); // Debug log

          // Format the venue data to match what OutreachTable expects
          const formattedVenue = {
            ...newOutreach,
            location: newOutreach.location || venue.address, // Use address if location is missing
            oneLiner: newOutreach.oneliner || venue.oneLiner, // Note: case difference
            email: newOutreach.email ? newOutreach.email.split(',') : [],
            phone: newOutreach.phoneNumber || venue.phone,
            website: newOutreach.website || venue.website
          };

          console.log('Formatted venue:', formattedVenue); // Debug log

          setSelectedEvent(prev => ({
            ...prev,
            venueOutreach: [...(prev.venueOutreach || []), formattedVenue]
          }));
          return 'Added to outreach list';
        }
        throw new Error('Failed to create outreach');
      } catch (error) {
        console.error('Error creating outreach:', error);
        return 'Failed to add to outreach list';
      }
    }
    return 'Operation failed';
  };

  const getVenueIdentifier = (venue) => {
    const venueName = venue.name;
    const venueAddress = venue.address || venue.location;
    return `${venueName}__${venueAddress}`.toLowerCase();
  };

  const isVenueInOutreach = (venue) => {
    console.log('Full venue object:', venue);
    console.log('Full outreach array:', selectedEvent?.venueOutreach);
    
    return selectedEvent?.venueOutreach?.some(v => {
      const outreachId = getVenueIdentifier(v);
      const venueId = getVenueIdentifier(venue);
      console.log('Comparing identifiers:', {outreachId, venueId});
      return outreachId === venueId;
    }) || false;
  };

  const handleVenueClick = async (venue) => {
    const message = await handleVenueOutreach(venue);
    
    // Clear any existing timeout
    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout);
    }
    
    setToastMessage(message);
    setIsToastLeaving(false);
    setShowToast(true);
    
    // Set new timeout
    window.toastTimeout = setTimeout(() => {
      setIsToastLeaving(true);
      setTimeout(() => {
        setShowToast(false);
        setIsToastLeaving(false);
      }, 300);
    }, 2000);
  };

  const handleVenueSearch = async () => {
    if (!venueSearchState.searchText.trim()) {
      setVenueSearchState(prev => ({
        ...prev,
        error: 'Please describe your event space needs',
        showError: true
      }));
      return;
    }

    if (!venueSearchState.userCity.trim()) {
      setVenueSearchState(prev => ({
        ...prev,
        error: 'Please enter a city',
        showError: true
      }));
      return;
    }

    setVenueSearchState(prev => ({ ...prev, isGenerating: true }));
    setIsStreaming(true);
    setVenues([]);

    try {
      const response = await fetch('https://serenidad.click/hacktime/findVenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generalRequest: venueSearchState.searchText,
          tags: venueSearchState.selectedVenueTypes.includes('all') ? 
            venueTypeOptions : 
            venueSearchState.selectedVenueTypes,
          cityName: venueSearchState.userCity
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Remove the opening of the JSON array if this is the first chunk
        if (isFirstChunk) {
          const startIdx = buffer.indexOf('[');
          if (startIdx !== -1) {
            buffer = buffer.substring(startIdx + 1);
            isFirstChunk = false;
          }
        }

        // Process venues one at a time
        while (true) {
          // Look for a complete venue object (between { and })
          const openBraceIndex = buffer.indexOf('{');
          if (openBraceIndex === -1) break;
          
          let depth = 0;
          let closeIndex = -1;
          
          // Find the matching closing brace
          for (let i = openBraceIndex; i < buffer.length; i++) {
            if (buffer[i] === '{') depth++;
            if (buffer[i] === '}') depth--;
            if (depth === 0) {
              closeIndex = i + 1;
              break;
            }
          }
          
          if (closeIndex === -1) break; // No complete object found
          
          try {
            // Extract everything up to the comma after the closing brace
            let venueStr = buffer.substring(openBraceIndex, closeIndex);
            const commaIndex = buffer.indexOf(',', closeIndex);
            
            if (commaIndex !== -1) {
              buffer = buffer.substring(commaIndex + 1);
            } else {
              buffer = buffer.substring(closeIndex);
            }

            // Parse the venue object
            const venue = JSON.parse(venueStr);
            if (venue.name && venue.address) {
              setVenues(prev => [...prev, venue]);
            }
          } catch (e) {
            // If parsing fails, skip to next object
            const nextOpen = buffer.indexOf('{', openBraceIndex + 1);
            if (nextOpen === -1) {
              buffer = '';
            } else {
              buffer = buffer.substring(nextOpen);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setVenueSearchState(prev => ({
        ...prev,
        error: 'Failed to fetch venues',
        showError: true
      }));
    } finally {
      setVenueSearchState(prev => ({ ...prev, isGenerating: false }));
      setIsStreaming(false);
    }
  };

  const handlePromptBlur = async () => {
    // Only proceed if there's text and no venue types are currently selected
    if (!venueSearchState.searchText.trim() || venueSearchState.selectedVenueTypes.length > 0) {
      return;
    }

    try {
      const response = await fetch('https://serenidad.click/hacktime/autoVenueTypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: venueSearchState.searchText,
          availableVenueTypes: venueTypeOptions
        })
      });

      const data = await response.json();
      
      if (response.ok && data.venueTypes && Array.isArray(data.venueTypes) && data.venueTypes.length > 0) {
        setVenueSearchState(prev => ({
          ...prev,
          selectedVenueTypes: data.venueTypes
        }));
        
        // Save to localStorage
        localStorage.setItem(`lastVenueTypes_${eventId}`, JSON.stringify(data.venueTypes));
        
        setIsPulsing(true);
        setTimeout(() => {
          setIsPulsing(false);
        }, 750);
      }
    } catch (error) {
      console.log('Auto venue types not available:', error);
    }
  };

  const handleCancel = () => {
    setVenueSearchState(prev => ({
      ...prev,
      isGenerating: false,
      searchText: '',
      selectedVenueTypes: [],
      error: '',
      showError: false,
      loadingDots: ''
    }));
    setVenues([]);
    setIsStreaming(false);
    
    // Clear from localStorage
    localStorage.removeItem(`lastSearchPrompt_${eventId}`);
    localStorage.removeItem(`lastVenueTypes_${eventId}`);
  };

  return (
    <div style={{marginTop: 24, width: 800, display: "flex", flexDirection: "column", alignItems: "center"}}>
      <p style={{margin: 0, fontSize: 24}}>Venue Search (beta)</p>
      
      <textarea 
        style={{
          border: "1px solid #59636E", 
          borderRadius: 16, 
          width: 600, 
          fontSize: 16, 
          padding: 16, 
          height: 150, 
          marginTop: 16,
          opacity: venueSearchState.isGenerating ? 0.6 : 1,
          pointerEvents: venueSearchState.isGenerating ? 'none' : 'auto'
        }}
        value={venueSearchState.searchText}
        disabled={venueSearchState.isGenerating}
        placeholder="describe your event, target # of attendees, & event space needs..."
        className="venue-search-input"
        onBlur={handlePromptBlur}
        onChange={(e) => {
          const newText = e.target.value;
          setVenueSearchState(prev => ({
            ...prev,
            searchText: newText,
            error: newText.trim() ? '' : prev.error,
            showError: newText.trim() ? false : prev.showError
          }));
          localStorage.setItem(`lastSearchPrompt_${eventId}`, newText);
        }}
      ></textarea>
      <div style={{
        width: 632, 
        marginTop: 16, 
        gap: 16, 
        display: "flex", 
        flexDirection: "row",
        opacity: venueSearchState.isGenerating ? 0.6 : 1,
        pointerEvents: venueSearchState.isGenerating ? 'none' : 'auto'
      }}>
        <div className={`venue-dropdown ${isPulsing ? 'pulse' : ''}`} style={{
          width: "100%", 
          padding: "0 12px", 
          display: 'flex', 
          flexDirection: "column",
          fontSize: 16, 
          borderRadius: 16, 
          position: "relative",
          border: "1px solid #626364",
          minHeight: 42
        }}>
          <div 
            onClick={() => setVenueSearchState(prev => ({ ...prev, isVenueDropdownOpen: !prev.isVenueDropdownOpen }))}
            style={{
              display: 'flex',
              flexDirection: "row",
              gap: 8,
              cursor: "pointer",
              alignItems: "center",
              padding: venueSearchState.needsPadding ? "8px 0" : "0",
              minHeight: 42
            }}
          >
            <img src="./venueTypes.svg"/>
            <div 
              ref={tagsContainerRef}
              style={{
                display: "flex", 
                flexWrap: "wrap", 
                gap: 4, 
                flex: 1,
                alignItems: "center"
              }}
            >
              {venueSearchState.selectedVenueTypes.length === 0 ? (
                <p style={{margin: 0, color: "#949596"}}>Select venue types</p>
              ) : venueSearchState.selectedVenueTypes.includes('all') ? (
                <p style={{margin: 0, color: "#000"}}>All Venue Types</p>
              ) : (
                venueSearchState.selectedVenueTypes.map((type, index) => (
                  <span 
                    key={type}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTypes = venueSearchState.selectedVenueTypes.filter(t => t !== type);
                      setVenueSearchState(prev => ({
                        ...prev,
                        selectedVenueTypes: newTypes
                      }));
                      localStorage.setItem(`lastVenueTypes_${eventId}`, JSON.stringify(newTypes));
                    }}
                    className="venue-tag"
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    {type}
                  </span>
                ))
              )}
            </div>
          </div>
          
          {venueSearchState.isVenueDropdownOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              border: "1px solid #626364",
              borderRadius: 8,
              marginTop: 4,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              zIndex: 1000
            }}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (venueSearchState.selectedVenueTypes.includes('all')) {
                    setVenueSearchState(prev => ({
                      ...prev,
                      selectedVenueTypes: []
                    }));
                  } else {
                    setVenueSearchState(prev => ({
                      ...prev,
                      selectedVenueTypes: ['all']
                    }));
                  }
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  backgroundColor: venueSearchState.selectedVenueTypes.includes('all') ? "#F5F5F5" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 500,
                  borderRadius: 8,
                  margin: "2px"
                }}
              >
                <input 
                  type="checkbox"
                  checked={venueSearchState.selectedVenueTypes.includes('all')}
                  onChange={() => {}}
                  style={{ margin: 0 }}
                />
                All Venue Types
              </div>
              {venueTypeOptions.map(type => (
                <div
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (venueSearchState.selectedVenueTypes.includes('all')) {
                      setVenueSearchState(prev => ({
                        ...prev,
                        selectedVenueTypes: [type]
                      }));
                    } else {
                      setVenueSearchState(prev => ({
                        ...prev,
                        selectedVenueTypes: prev.selectedVenueTypes.includes(type) 
                          ? prev.selectedVenueTypes.filter(t => t !== type)
                          : [...prev.selectedVenueTypes, type]
                      }));
                    }
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    backgroundColor: venueSearchState.selectedVenueTypes.includes(type) && !venueSearchState.selectedVenueTypes.includes('all') 
                      ? "#F5F5F5" 
                      : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "background-color 0.15s",
                    borderRadius: 8,
                    margin: "2px"
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={venueSearchState.selectedVenueTypes.includes(type) || venueSearchState.selectedVenueTypes.includes('all')}
                    onChange={() => {}}
                    style={{ margin: 0 }}
                  />
                  {type}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{width: "100%", padding: 12, display: 'flex', flexDirection: "row", gap: 8, fontSize: 16, borderRadius: 16, height: "100%", border: "1px solid #626364"}}>
          <img src="./location.svg"/>
          <input 
            type="text"
            placeholder="City"
            value={venueSearchState.userCity}
            onChange={(e) => {
              const newCity = e.target.value;
              setVenueSearchState(prev => ({ ...prev, userCity: newCity }));
              localStorage.setItem(`lastSearchCity_${eventId}`, newCity);
            }}
            style={{
              margin: 0,
              color: "#000",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 16,
              width: "100%",
              "::placeholder": {
                color: "#949596"
              }
            }}
          />
        </div>
      </div>
      <div 
        onMouseEnter={() => setIsHoveringGenerate(true)}
        onMouseLeave={() => setIsHoveringGenerate(false)}
        onClick={!venueSearchState.isGenerating ? handleVenueSearch : undefined}
        className="generate-button"
        style={{
          backgroundColor: "#000", 
          cursor: venueSearchState.isGenerating ? "default" : "pointer", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          padding: 12, 
          marginTop: 16, 
          width: 600, 
          borderRadius: 16,
          transition: "background-color 0.2s ease"
        }}
      >
        <p 
          onClick={venueSearchState.isGenerating ? handleCancel : undefined}
          style={{
            margin: 0, 
            fontSize: 16, 
            color: "#fff",
            cursor: venueSearchState.isGenerating ? "pointer" : "default"
          }}
        >
          {venueSearchState.isGenerating 
            ? isHoveringGenerate 
              ? "Cancel" 
              : `Generating${venueSearchState.loadingDots}`
            : 'Bulk Generate Results'
          }
        </p>
      </div>

      {venues.length > 0 && (
        <div style={{
          width: 632,
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            width: "100%"
          }}>
            {venues.map((venue, index) => (
              <div 
                key={`${venue.name}-${venue.address}`}
                className={`venue-card ${isVenueInOutreach(venue) ? 'selected' : ''}`}
                onClick={() => handleVenueClick(venue)}
                style={{
                  position: "relative",
                  paddingTop: "100%",
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: "#000000",
                  cursor: "pointer",
                  '--index': index,
                  animation: `fadeSlideIn 0.3s ease-out ${index * 0.1}s forwards`
                }}
                onMouseEnter={(e) => {
                  const plusButton = e.currentTarget.querySelector('.plus-button');
                  const globeButton = e.currentTarget.querySelector('.globe-button');
                  if (plusButton) plusButton.style.opacity = '1';
                  if (globeButton) globeButton.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const plusButton = e.currentTarget.querySelector('.plus-button');
                  const globeButton = e.currentTarget.querySelector('.globe-button');
                  if (plusButton) plusButton.style.opacity = '0';
                  if (globeButton) globeButton.style.opacity = '0';
                }}
              >
                <div 
                  className={`plus-button ${isVenueInOutreach(venue) ? 'active' : ''}`}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 2,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {isVenueInOutreach(venue) ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                {(() => {
                  console.log('Checking website:', {
                    hasWebsite: !!venue.website,
                    website: venue.website,
                    isNA: venue.website === 'N/A',
                    shouldShow: venue.website && venue.website !== 'N/A'
                  });
                  return (venue.website && venue.website !== 'N/A') && (
                    <a 
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="globe-button"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '52px',
                        zIndex: 2,
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        opacity: 0,
                        transition: 'opacity 0.2s ease, transform 0.2s ease'
                      }}
                    >
                      <img 
                        src="./icons/globe.svg" 
                        alt="Visit Website"
                        style={{
                          width: '16px',
                          height: '16px'
                        }}
                      />
                    </a>
                  );
                })()}
                {venue.image && venue.image !== "null" ? (
                  <img 
                    src={venue.image}
                    alt={venue.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  />
                ) : null}
                
                {/* Gradient overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,  // This is shorthand for top: 0, right: 0, bottom: 0, left: 0
                  background: "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.1) 25%, rgba(0, 0, 0, 0.2) 40%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0.6) 100%)",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  gap: 4,
                  borderRadius: 12,  // Match parent's border radius
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 500,
                    color: "#FFFFFF",
                    textShadow: "0px 2px 8px rgba(0, 0, 0, 0.8), 0px 1px 3px rgba(0, 0, 0, 0.9)"
                  }}>
                    {venue.name}
                  </h3>
                  
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#FFFFFF",
                        textDecoration: "none",
                        fontSize: 13,
                        textShadow: "0px 2px 8px rgba(0, 0, 0, 0.8), 0px 1px 3px rgba(0, 0, 0, 0.9)"
                      }}
                    >
                      <img 
                        src="./location.svg" 
                        alt="location"
                        style={{
                          filter: "brightness(0) invert(1)", // Makes the SVG white
                          width: 16,
                          height: 16
                        }}
                      />
                      {venue.address.split(',').slice(0, 2).join(',')}
                    </a>
                  </div>
                  
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#FFFFFF",
                    opacity: 0.9,
                    textShadow: "0px 2px 8px rgba(0, 0, 0, 0.8), 0px 1px 3px rgba(0, 0, 0, 0.9)"
                  }}>
                    {venue.oneLiner}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {venueSearchState.showError && (
        <div 
          className={`error-message ${venueSearchState.showError ? 'shake-horizontal' : ''}`}
          style={{
            color: '#FF4444',
            fontSize: 14,
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 14A6 6 0 108 2a6 6 0 000 12zM8 5v3.5M8 11h.01" stroke="#FF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {venueSearchState.error}
        </div>
      )}

      {showToast && (
        <div
          className={`toast-notification ${isToastLeaving ? 'hide' : ''}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#333',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1000,
            fontSize: '14px'
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
} 