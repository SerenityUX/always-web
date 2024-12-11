import React from 'react';

const formatLocation = (location) => {
  // Split by comma and take first part (street address)
  return location.split(',')[0].trim();
};

export default function OutreachTable({ venues, onSendEmail, onDeleteOutreach }) {
  if (!venues || venues.length === 0) {
    return (
      <div style={{
        width: 800,
        marginTop: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        color: "#666"
      }}>
        <p style={{
          margin: 0,
          fontSize: 24,
          color: "#000"
        }}>
          Venue Outreach
        </p>
        <p style={{
          margin: 0,
          fontSize: 16,
          textAlign: "center",
          maxWidth: 400,
          lineHeight: 1.5
        }}>
          No venues added for outreach yet. Head over to venue search to find some potential venues to reach out to.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: 800, marginTop: 24 }}>
      <div style={{
        display: "flex", 
        width: "100%", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: 24
      }}>
        <p style={{margin: 0, fontSize: 24}}>Venue Outreach</p>
        <button
          onClick={() => {}}
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
          Edit Outreach Template
        </button>
      </div>

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
              width: "17%",
              borderRight: "1px solid #EBEBEB"
            }}>
              Venue Name
            </th>
            <th style={{ 
              textAlign: "left", 
              fontWeight: "normal",
              color: "#666",
              padding: "8px 0",
              width: "20%",
              borderRight: "1px solid #EBEBEB",
              paddingLeft: "16px"
            }}>
              Location
            </th>
            <th style={{ 
              textAlign: "left", 
              fontWeight: "normal",
              color: "#666",
              padding: "8px 0",
              width: "48%",
              borderRight: "1px solid #EBEBEB",
              paddingLeft: "16px"
            }}>
              Description
            </th>
            <th style={{ 
              textAlign: "left", 
              fontWeight: "normal",
              color: "#666",
              padding: "8px 0",
              width: "15%",
              paddingLeft: "16px"
            }}>
              {"Outreach"}
            </th>
            <th style={{ 
              width: 40,  // Fixed width for trash icon column
              padding: "8px 0"
            }}>
              {/* Empty header for trash icon column */}
            </th>
          </tr>
        </thead>
        <tbody>
          {venues?.map((venue, index) => (
            <tr key={index} style={{
              borderBottom: "1px solid #EBEBEB",
              position: "relative"  // Added for trash icon positioning
            }}>
              <td style={{ 
                padding: "12px 0",
                borderRight: "1px solid #EBEBEB"
              }}>
                {venue.website ? (
                  <a 
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#000",
                      textDecoration: "underline",
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    {venue.name}
                  </a>
                ) : (
                  venue.name
                )}
              </td>
              <td style={{ 
                padding: "12px 0",
                borderRight: "1px solid #EBEBEB",
                paddingLeft: "16px"
              }}>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#000",
                    textDecoration: "underline",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {formatLocation(venue.location)}
                </a>
              </td>
              <td style={{ 
                padding: "12px 0",
                borderRight: "1px solid #EBEBEB",
                paddingLeft: "16px"
              }}>
                {venue.oneLiner}
              </td>
              <td style={{ 
                padding: "12px 0",
                paddingLeft: "16px",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "8px"
              }}>
                {((venue.email && venue.email.length > 0) || (venue.emails && venue.emails.length > 0)) && (
                  <button
                    onClick={() => onSendEmail(venue)}
                    className="send-email-button"
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#000",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    Email
                  </button>
                )}
                {(venue.phone || venue.phoneNumber) && (
                  <button
                    onClick={() => window.open(`tel:${venue.phone || venue.phoneNumber}`)}
                    className="send-email-button"
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#000",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    Call
                  </button>
                )}
                {(venue.email?.length === 0 && venue.emails?.length === 0 && !venue.phone && !venue.phoneNumber) && (
                  <span style={{ color: "#666", fontSize: 13 }}>
                    No contact info
                  </span>
                )}
              </td>
              <td style={{ 
                padding: "12px 0",
                width: 40,
                position: "relative"
              }}>
                <div 
                  className="trash-icon"
                  onClick={() => onDeleteOutreach(venue)}
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
                    alt="Delete outreach"
                    style={{
                      width: 16,
                      height: 16
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 