export const formatTime = (date) => {
  const minutes = date.getUTCMinutes();
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }).toLowerCase();
};

export const isTimeOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

export const isWithinEventBounds = (startTime, endTime, eventStartTime, eventEndTime) => {
  return startTime >= eventStartTime && endTime <= eventEndTime;
};

export const parseTimeString = (timeStr) => {
  const cleanStr = timeStr.toLowerCase().replace(/\s+/g, '');
  const isPM = cleanStr.includes('pm');
  const isAM = cleanStr.includes('am');
  
  let timeNumbers = cleanStr
    .replace(/[ap]m/, '')
    .replace(/[^\d:]/g, '');
  
  let hours, minutes;
  
  if (timeNumbers.includes(':')) {
    [hours, minutes] = timeNumbers.split(':').map(num => parseInt(num));
  } else {
    hours = parseInt(timeNumbers);
    minutes = 0;
  }
  
  if (isNaN(hours) || hours < 0 || hours > 12 || 
      isNaN(minutes) || minutes < 0 || minutes >= 60) {
    throw new Error('Invalid time format');
  }
  
  if (isPM && hours !== 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
};

export const adjustTimeForDay = (timeDate, referenceDate, hours, minutes) => {
  let adjustedDate = new Date(Date.UTC(
    timeDate.getUTCFullYear(),
    timeDate.getUTCMonth(),
    timeDate.getUTCDate(),
    hours,
    minutes,
    0,
    0
  ));

  if (referenceDate && adjustedDate < referenceDate) {
    adjustedDate = new Date(Date.UTC(
      timeDate.getUTCFullYear(),
      timeDate.getUTCMonth(),
      timeDate.getUTCDate() + 1,
      hours,
      minutes,
      0,
      0
    ));
  }

  return adjustedDate;
};

export const timeStringToDate = (timeStr, baseDate) => {
  const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
  return new Date(Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate(),
    hours,
    minutes,
    0,
    0
  ));
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const MAX_DURATION = 23.99 * 60 * 60 * 1000; // Just under 24 hours in milliseconds

export const COLORS = [
  "2,147,212",
  "218,128,0",
  "8,164,42",
  "142,8,164",
  "190,58,44",
  "89,89,89"
]; 