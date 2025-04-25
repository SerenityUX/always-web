export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId } = req.query;
    
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Fetch the schedule data directly
    const response = await fetch(`https://serenidad.click/hacktime/getSchedule/${eventId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch schedule data');
    }

    const data = await response.json();
    const event = data;

    const COLORMAP = {
      "2,147,212": "deepskyblue",
      "218,128,0": "darkorange",
      "8,164,42": "limegreen",
      "142,8,164": "darkviolet",
      "190,58,44": "firebrick",
      "89,89,89": "dimgray"
    };
    
    // Generate ICS content
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//always.sh//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:${event.event.title}
TZID:${event.timezone}
X-PUBLISHED-TTL:PT30M
REFRESH-INTERVAL;VALUE=DURATION:PT30M
X-WR-RELCALID:${eventId}@event.always.sh
X-CLACKS-OVERHEAD:GNU Terry Pratchett
X-NORA-SAYS:haiii :3
METHOD:PUBLISH
`;

    // Add schedule items as events
    if (event.schedule && event.schedule.length > 0) {
      event.schedule.forEach((scheduleItem) => {
        // yes, local time is stored as zulu time in the DB
        // cry about it :-P
        const formatDate = (date) => {
          const d = date;
          const year = d.getUTCFullYear();
          const month = String(d.getUTCMonth() + 1).padStart(2, '0');
          const day = String(d.getUTCDate()).padStart(2, '0');
          const hours = String(d.getUTCHours()).padStart(2, '0');
          const minutes = String(d.getUTCMinutes()).padStart(2, '0');
          const seconds = String(d.getUTCSeconds()).padStart(2, '0');
          return `${year}${month}${day}T${hours}${minutes}${seconds}`;
        };

        icsContent += `BEGIN:VEVENT
DTSTART;TZID=${event.timezone}:${formatDate(new Date(scheduleItem.time.start))}
DTEND;TZID=${event.timezone}:${formatDate(new Date(scheduleItem.time.end))}
DTSTAMP:${formatDate(new Date())}Z
UID:${scheduleItem.id}@scheduleitem.always.sh
SUMMARY:${scheduleItem.title}
COLOR:${COLORMAP[scheduleItem.color] || "deepskyblue"}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
      });
    }

    icsContent += 'END:VCALENDAR';

    // Set headers for ICS file
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="always-calendar.ics"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send the ICS content
    res.status(200).send(icsContent);
  } catch (error) {
    console.error('Error serving ICS file:', error);
    res.status(500).json({ error: 'Failed to serve calendar file' });
  }
} 