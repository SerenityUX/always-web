import React, { useState } from 'react';

export const AnnouncementView = ({
  selectedEvent,
  selectedCalendarEvent,
  setSelectedCalendarEvent,
  setSelectedTask,
  newEventId,
  setNewEventId,
  handleDeleteConfirmation,
  handleEventTitleUpdate,
  handleTimeUpdate,
  handleDeleteCalendarEvent,
  handleColorUpdate,
  selectedEventId,
  animatingColor,
  setSelectedEvent,
  COLORS,
  MAX_DURATION,
  isWithinEventBounds,
  isTimeOverlapping,
  timeStringToDate,
}) => {
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatTime = (timestamp) => {
        // Add 'Z' only if it doesn't end with Z
        const fullTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
        return new Date(fullTimestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.trim()) return;
        
        setIsSubmitting(true);
        try {
            const response = await fetch('https://serenidad.click/hacktime/createAnnouncement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: newAnnouncement,
                    eventId: selectedEvent.id,
                    token: localStorage.getItem('token'),
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create announcement');
            }
            // console.log(data)
            // Add the new announcement to the UI
            const updatedEvent = {
                ...selectedEvent,
                announcements: [data, ...selectedEvent.announcements]
            };
            setSelectedEvent(updatedEvent);
            setNewAnnouncement('');
        } catch (error) {
            console.error('Failed to create announcement:', error);
            alert(error.message || 'Failed to create announcement. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return(
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
                <p style={{margin: 0}}>Announcements</p>
                
                {/* New Announcement Form */}
                <form onSubmit={handleSubmit} style={{
                    marginTop: 16,
                    marginBottom: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12
                }}>
                    <textarea
                        value={newAnnouncement}
                        onChange={(e) => setNewAnnouncement(e.target.value)}
                        placeholder="Write a new announcement..."
                        style={{
                            width: "100%",
                            minHeight: 80,
                            padding: 12,
                            fontSize: 16,
                            borderRadius: 8,
                            border: "1px solid #EBEBEB",
                            resize: "vertical"
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting || !newAnnouncement.trim()}
                        style={{
                            alignSelf: "flex-end",
                            padding: "8px 16px",
                            fontSize: 16,
                            backgroundColor: "#007AFF",
                            color: "white",
                            border: "none",
                            marginTop: -56, 
                            marginRight: -17,
                            borderRadius: 8,
                            cursor: newAnnouncement.trim() ? "pointer" : "not-allowed",
                            opacity: newAnnouncement.trim() ? 1 : 0.5
                        }}
                    >
                        {isSubmitting ? "Sending..." : "Send"}
                    </button>
                </form>

                {/* Existing Announcements List */}
                <div style={{display: "flex", flexDirection: "column"}}>
                    {selectedEvent?.announcements.map((announcement, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <div style={{ height: 1, backgroundColor: "#EBEBEB", margin: "24px 0 16px 0" }} />}
                            <div style={{display: "flex", gap: 8, flexDirection: "column"}}>
                                <div style={{display: "flex", flexDirection: "row", alignItems: "center", gap: 16}}>
                                    <img style={{width: 36, height: 36, borderRadius: "100%"}} src={announcement.sender.profilePicture}/>
                                    <p style={{fontSize: 18, opacity: 0.9}}>{announcement.sender.name}</p>
                                    <p style={{fontSize: 12, opacity: 0.5}}>
                                        {formatTime(announcement.timeSent)}
                                    </p>
                                </div>
                                <p style={{fontSize: 18, margin: 0}}>{announcement.content}</p>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}
