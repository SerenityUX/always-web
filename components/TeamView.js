import React from 'react';

const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const TeamView = ({
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
  setIsInvitingNewUser,
}) => {
    const teamMembers = selectedEvent?.teamMembers || [];
    
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
              {teamMembers.length > 0 && (
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24
                }}>
                  <p style={{margin: 0}}>Team</p>
                  <button
                    onClick={() => setIsInvitingNewUser(true)}
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
                      fontSize: 16
                    }}
                  >
                    Invite
                  </button>
                </div>
              )}

              {teamMembers.length === 0 ? (
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
                    src="/cute-dog-team.gif" 
                    alt="Team"
                    style={{
                      width: 256,
                      opacity: 0.8
                    }}
                  />
                  <div style={{maxWidth: 450}}>
                    <p style={{
                      fontSize: 24,
                      margin: "0 0 16px 0"
                    }}>
                      It's always more fun with friends
                    </p>
                    <p style={{
                      fontSize: 16,
                      color: "#666",
                      margin: 0,
                      lineHeight: "24px"
                    }}>
                      right now it's just you here! Invite your team members to collaborate on this event together
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInvitingNewUser(true)}
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
                    Invite Your First Team Member
                  </button>
                </div>
              ) : (
                // Existing team members list
                <div style={{display: "flex", marginBottom: 32, flexDirection: "column"}}>
                  {teamMembers.map((member, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <div style={{ height: 1, backgroundColor: "#EBEBEB", margin: "16px 0" }} />}
                      <div style={{display: "flex", gap: 8, flexDirection: "row", alignItems: "center"}}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: "100%",
                          backgroundColor: member.profilePicture ? "transparent" : "#666",
                          backgroundImage: member.profilePicture ? `url(${member.profilePicture})` : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#EBEBEB",
                          fontSize: "12px",
                          fontWeight: 500
                        }}>
                          {!member.profilePicture && getInitials(member.name)}
                        </div>
                        <div style={{display: "flex", flexDirection: "column"}}>
                          <p style={{fontSize: 18, margin: 0}}>{member.name}</p>
                          <p style={{fontSize: 14, margin: 0, opacity: 0.5}}>{member.email}</p>
                          {member.roleDescription && (
                            <p style={{fontSize: 14, margin: "4px 0 0 0", opacity: 0.7}}>{member.roleDescription}</p>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
    );
};
