import Head from "next/head";
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Navigation from '../components/Navigation';
import { TaskCard } from '../components/TaskCard';
import { ScheduleView } from '../components/ScheduleView';
import { RunOfShow } from '../components/RunOfShow';
import { AnnouncementView } from "@/components/AnnouncementView";
import { TeamView } from "@/components/TeamView";
import { WelcomeView } from '../components/WelcomeView';
import VenueView from '../components/VenueView';



const COLORS = [
  "2,147,212",
  "218,128,0",
  "8,164,42",
  "142,8,164",
  "190,58,44",
  "89,89,89"
];


// Move these outside the component
const formatTime = (date) => {
  const minutes = date.getUTCMinutes();
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }).toLowerCase();
};

const isTimeOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

const isWithinEventBounds = (startTime, endTime, eventStartTime, eventEndTime) => {
  return startTime >= eventStartTime && endTime <= eventEndTime;
};



// Add this helper at the top with other helpers
const roundEventTimes = (startTime, endTime) => {
  // Create Date objects
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Round down start time to nearest hour
  start.setUTCMinutes(0);
  start.setUTCSeconds(0);
  start.setUTCMilliseconds(0);
  
  // Round up end time to next hour
  if (end.getUTCMinutes() > 0 || end.getUTCSeconds() > 0 || end.getUTCMilliseconds() > 0) {
    end.setUTCHours(end.getUTCHours() + 1);
    end.setUTCMinutes(0);
    end.setUTCSeconds(0);
    end.setUTCMilliseconds(0);
  }
  
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString()
  };
};

// Add this helper function to convert 24h time string to Date
const timeStringToDate = (timeStr, baseDate) => {
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

// Add this constant at the top with other constants
const MAX_DURATION = 23.99 * 60 * 60 * 1000; // Just under 24 hours in milliseconds

// Add this helper function at the top level

// First create the TaskCard component (at the top of the file or in a separate component file)

// Add this constant at the top of the file with other constants
const TABS = ["Run of Show", "Schedule", "Announcements", "Venue", "Team"];

// Add this constant at the top with other constants
const commonTimezones = {
  "America/Los_Angeles": "Pacific Time (PT)",
  "America/Denver": "Mountain Time (MT)",
  "America/Chicago": "Central Time (CT)",
  "America/New_York": "Eastern Time (ET)",
  "GMT": "Greenwich Mean Time (GMT)",
  "UTC": "Coordinated Universal Time (UTC)"
};

// Add this helper function at the top level
const getEventCount = (events) => {
  if (!events) return 0;
  return Object.keys(events).length;
};

// Add this helper function to process event data with rounded times
const processEventWithRoundedTimes = (event) => {
  if (!event) return null;
  
  // Round the main event times
  const { startTime: roundedStart, endTime: roundedEnd } = roundEventTimes(
    event.startTime,
    event.endTime
  );

  return {
    ...event,
    startTime: roundedStart,
    endTime: roundedEnd
  };
};

// Add this constant at the top of the file with other constants
const timezoneToCity = {
  'America/Los_Angeles': 'San Francisco',
  'America/New_York': 'Burlington, Vermont',
  'America/Chicago': 'Chicago',
  'America/Denver': 'Denver',
  'Europe/London': 'London',
  'Europe/Paris': 'Paris',
  'Asia/Tokyo': 'Tokyo',
  'Asia/Shanghai': 'Shanghai',
  'Australia/Sydney': 'Sydney'
};

const getVenueIdentifier = (venue) => {
  return `${venue.name}__${venue.address}`.toLowerCase();
};

// Add this constant at the top with other constants
const venueTypeOptions = [
  "Conference Center",
  "Makerspace",
  "Co-working Space", 
  "Corporate Office",
  "Startup Office",
  "Cafe",
  "Library",
];

export default function Event() {
  const router = useRouter();
  const { tab, eventId } = router.query;
  const currentTab = tab || "Run of Show";

  const [creatingEvent, setShowEventDropdown] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  const [lowerNav, setLowerNav] = useState(false);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [newEventId, setNewEventId] = useState(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskColumn, setSelectedTaskColumn] = useState(null); // Add this new state

  const [animatingColor, setAnimatingColor] = useState(null);

  const [isInvitingNewUser, setIsInvitingNewUser] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    roleDescription: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [invalidEmail, setInvalidEmail] = useState(false);

  const emailInputRef = useRef(null);

  // Add this ref inside your component
const titleInputRef = useRef(null);
const previousTaskIdRef = useRef(null);

// Add this useEffect to handle auto-focus
useEffect(() => {
  if (selectedTask?.id !== previousTaskIdRef.current) {
    if (selectedTask && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
    previousTaskIdRef.current = selectedTask?.id;
  }
}, [selectedTask]);

  // Add the new state variables here, with the other state declarations
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [editingTaskDescription, setEditingTaskDescription] = useState('');

  // Add the task update handler
  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/editEventTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          taskId,
          ...updates
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();

      // Update local state
      setSelectedEvent(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        )
      }));

      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  // Add this effect to reset editing state when task selection changes
  useEffect(() => {
    if (selectedTask) {
      setEditingTaskTitle(selectedTask.title);
      setEditingTaskDescription(selectedTask.description || '');
    } else {
      setEditingTaskTitle('');
      setEditingTaskDescription('');
    }
  }, [selectedTask]);

  useEffect(() => {
    if (isInvitingNewUser && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [isInvitingNewUser]);

  // Add this at the top of the Event component
  const isRouterReady = router.isReady;

  // Update the authentication useEffect
  useEffect(() => {
    async function authenticate() {
      console.log('Starting authentication, router ready:', isRouterReady);
      if (!isRouterReady) return; // Don't proceed until router is ready
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/signup');
        return;
      }

      try {
        const response = await fetch('https://serenidad.click/hacktime/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const userData = await response.json();
        console.log('Auth response received:', {
          hasOrgEvents: !!userData.organizationEvents,
          eventCount: Object.keys(userData.events || {}).length,
          currentUrl: router.asPath // Log current URL
        });

        if (userData.organizationEvents) {
          userData.events = userData.organizationEvents;
        }

        // Process events
        if (userData.events) {
          userData.events = Object.entries(userData.events).reduce((acc, [id, event]) => {
            acc[id] = processEventWithRoundedTimes(event);
            return acc;
          }, {});
        }

        setUser(userData);

        // Handle event selection
        const currentEventId = router.query.eventId;
        console.log('Checking event selection:', {
          currentEventId,
          eventExists: currentEventId && userData.events[currentEventId],
          availableEvents: Object.keys(userData.events || {})
        });

        if (currentEventId && userData.events[currentEventId]) {
          console.log('Setting to requested event:', currentEventId);
          setSelectedEventId(currentEventId);
          setSelectedEvent(userData.events[currentEventId]);
        } else if (!currentEventId && Object.keys(userData.events).length > 0) {
          console.log('No event ID in URL, redirecting to default');
          const lastVisited = localStorage.getItem('lastVisited');
          const targetEventId = lastVisited && userData.events[lastVisited] 
            ? lastVisited 
            : Object.keys(userData.events)[0];
          router.push(`/event?eventId=${targetEventId}&tab=Run of Show`);
        }

        setLoading(false);
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/signup');
      }
    }

    authenticate();
  }, [isRouterReady]); // Add isRouterReady to dependencies

  useEffect(() => {
    console.log('Event selection effect triggered:', {
      hasUser: !!user,
      eventId,
      eventExists: user?.events?.[eventId]
    });

    if (user && eventId && user.events[eventId]) {
      const processedEvent = processEventWithRoundedTimes(user.events[eventId]);
      setSelectedEventId(eventId);
      setSelectedEvent(processedEvent);
      localStorage.setItem('lastVisited', eventId);
    }
  }, [user, eventId]);

  const handleUserUpdate = (updatedUser, eventId) => {
    setUser(updatedUser);
    if (eventId) {
      setSelectedEventId(eventId);
      setSelectedEvent(updatedUser.events[eventId]);
    }
  };

  const handleInviteChange = async (e) => {
    const { name, value } = e.target;
    setInviteForm(prev => ({ ...prev, [name]: value }));
    setInviteError(''); // Clear error when user starts typing
    setInvalidEmail(false); // Clear invalid email state
    setInviteLoading(false); // Reset any loading state when user is typing

    // Check if user exists when email is entered
    if (name === 'email' && value) {
      try {
        const response = await fetch(`https://serenidad.click/hacktime/checkUser/${value}`);
        const data = await response.json();
        
        // Check if user is already a team member
        const isExistingMember = selectedEvent?.teamMembers?.some(
          member => member.email.toLowerCase() === value.toLowerCase()
        );

        if (isExistingMember) {
          setInviteError('This person is already a team member');
          setInvalidEmail(true);
        } else if (data.exists) {
          setInviteForm(prev => ({ ...prev, name: data.name }));
        }
      } catch (error) {
        console.error('Error checking user:', error);
      }
    }
  };

  const handleInviteSubmit = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      setInviteError('Email and name are required');
      return;
    }

    // Don't proceed if there's already an error
    if (invalidEmail || inviteError) {
      return;
    }

    setInviteLoading(true);
    try {
      const response = await fetch('https://serenidad.click/hacktime/inviteToEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          inviteeEmail: inviteForm.email,
          inviteeName: inviteForm.name,
          roleDescription: inviteForm.roleDescription,
          eventId: selectedEventId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }

      // Update local state with new team member
      setSelectedEvent(prev => ({
        ...prev,
        teamMembers: [...(prev.teamMembers || []), {
          id: data.user.email,
          name: data.user.name,
          email: data.user.email,
          roleDescription: data.user.roleDescription,
          profilePicture: data.user.profilePicture
        }]
      }));

      // Clear the form
      setInviteForm({ email: '', name: '', roleDescription: '' });
      setInviteError('');
      setInvalidEmail(false);
      
      // Set button to "Invite Sent" temporarily
      setInviteLoading('sent');
      setTimeout(() => {
        setInviteLoading(false);
        // Focus back on email input
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 2000);

    } catch (error) {
      setInviteError(error.message);
      setInviteLoading(false); // Reset loading state on error
    }
  };

  // Add form submit handler
  const handleFormSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    handleInviteSubmit();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (
        e.key === 'Escape' && 
        isInvitingNewUser && 
        document.activeElement.tagName !== 'INPUT' && 
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        setIsInvitingNewUser(false);
        setInviteForm({ email: '', name: '', roleDescription: '' }); // Reset form
        setInviteError(''); // Clear any errors
        setInvalidEmail(false); // Reset invalid email state
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isInvitingNewUser]); // Only re-run if isInvitingNewUser changes

  useEffect(() => {
    const handlePlusKey = (e) => {
      if (
        e.key === '+' && 
        document.activeElement.tagName !== 'INPUT' && 
        document.activeElement.tagName !== 'TEXTAREA' &&
        !document.activeElement.hasAttribute('contenteditable')
      ) {
        e.preventDefault(); // Prevent the '+' from being typed
        setIsInvitingNewUser(true);
      }
    };

    document.addEventListener('keydown', handlePlusKey);
    return () => document.removeEventListener('keydown', handlePlusKey);
  }, []); // Empty dependency array since we don't need to re-run this effect

  // Update the handleEventTitleUpdate function
  const handleEventTitleUpdate = async (calendarEventId, newTitle) => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/updateCalendarEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          calendarEventId: calendarEventId,
          title: newTitle
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event title');
      }
      
      // Update the local state with the new title
      setSelectedEvent(prev => ({
        ...prev,
        calendar_events: prev.calendar_events.map(evt => 
          evt.id === calendarEventId ? { ...evt, title: newTitle } : evt
        )
      }));

    } catch (error) {
      console.error('Failed to update event title:', error);
      alert('Failed to update event title: ' + error.message);
    }
  };

  // Move handleDeleteCalendarEvent inside the component
  const handleDeleteCalendarEvent = async (calendarEventId) => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/deleteCalendarEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          calendarEventId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete calendar event');
      }

      // Remove the event from local state
      setSelectedEvent(prev => ({
        ...prev,
        calendar_events: prev.calendar_events.filter(event => event.id !== calendarEventId)
      }));

    } catch (error) {
      console.error('Failed to delete calendar event:', error);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedCalendarEvent(null);
        setSelectedTask(null)

      } 
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedCalendarEvent]);

  // Update the handleColorUpdate function
  const handleColorUpdate = async (calendarEventId, colorString) => {
    // Immediately update UI
    setAnimatingColor(colorString);
    setSelectedEvent(prev => ({
      ...prev,
      calendar_events: prev.calendar_events.map(evt => 
        evt.id === calendarEventId ? { ...evt, color: colorString } : evt
      )
    }));
    setSelectedCalendarEvent(prev => ({
      ...prev,
      color: colorString
    }));

    try {
      const response = await fetch('https://serenidad.click/hacktime/updateCalendarEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          calendarEventId,
          color: colorString
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event color');
      }

    } catch (error) {
      // Revert the changes if the API call fails
      setSelectedEvent(prev => ({
        ...prev,
        calendar_events: prev.calendar_events.map(evt => 
          evt.id === calendarEventId ? { ...evt, color: selectedCalendarEvent.color } : evt
        )
      }));
      setSelectedCalendarEvent(prev => ({
        ...prev,
        color: prev.color
      }));
    } finally {
      setAnimatingColor(null);
    }
  };

  // Update the keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle arrow keys if:
      // 1. Calendar event is selected
      // 2. Not focused on input/textarea
      // 3. Not focused on contentEditable element
      if (!selectedCalendarEvent || 
          document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.getAttribute('contenteditable') === 'true') {
        return;
      }

      const currentColorIndex = COLORS.indexOf(selectedCalendarEvent.color);
      let newIndex;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = currentColorIndex > 0 ? currentColorIndex - 1 : COLORS.length - 1;
        handleColorUpdate(selectedCalendarEvent.id, COLORS[newIndex]);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = currentColorIndex < COLORS.length - 1 ? currentColorIndex + 1 : 0;
        handleColorUpdate(selectedCalendarEvent.id, COLORS[newIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCalendarEvent]);

  // Update the handleTimeUpdate function
  const handleTimeUpdate = async (calendarEventId, newStartTime, newEndTime) => {
    // Validate times are within main event bounds
    const mainEventStart = new Date(selectedEvent.startTime);
    const mainEventEnd = new Date(selectedEvent.endTime);
    
    // Calculate duration
    const duration = newEndTime - newStartTime;
    
    // If duration would exceed max, don't allow it
    if (duration > MAX_DURATION) {
      return false;
    }

    // If end time is before start time and the duration would be reasonable,
    // move end time to next day
    if (newEndTime < newStartTime && (newEndTime.getTime() + 24 * 60 * 60 * 1000 - newStartTime.getTime()) <= MAX_DURATION) {
      newEndTime = new Date(newEndTime.getTime() + 24 * 60 * 60 * 1000);
    }
    
    if (!isWithinEventBounds(newStartTime, newEndTime, mainEventStart, mainEventEnd)) {
      alert('Event must be within the main event time bounds');
      return false;
    }

    // Check for overlaps with other events
    const hasOverlap = selectedEvent?.calendar_events?.some(event => {
      if (event.id === calendarEventId) return false; // Skip current event
      const existingStart = new Date(event.startTime);
      const existingEnd = new Date(event.endTime);
      return isTimeOverlapping(newStartTime, newEndTime, existingStart, existingEnd);
    });

    if (hasOverlap) {
      alert('Cannot overlap with existing events');
      return false;
    }

    try {
      const response = await fetch('https://serenidad.click/hacktime/updateCalendarEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          calendarEventId,
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event time');
      }

      // Update local state
      setSelectedEvent(prev => ({
        ...prev,
        calendar_events: prev.calendar_events.map(evt => 
          evt.id === calendarEventId 
            ? { ...evt, startTime: newStartTime.toISOString(), endTime: newEndTime.toISOString() } 
            : evt
        )
      }));

      setSelectedCalendarEvent(prev => ({
        ...prev,
        startTime: newStartTime.toISOString(),
        endTime: newEndTime.toISOString()
      }));

      return true;
    } catch (error) {
      console.error('Failed to update event time:', error);
      return false;
    }
  };

  // Add this function inside the Home component
  const handleDeleteConfirmation = (calendarEventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      handleDeleteCalendarEvent(calendarEventId);
      setSelectedCalendarEvent(null); // Close the modal after deletion
    }
  };

  // Add this effect for the keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCalendarEvent || 
          document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.getAttribute('contenteditable') === 'true') {
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleDeleteConfirmation(selectedCalendarEvent.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCalendarEvent]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedTask || 
          document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.getAttribute('contenteditable') === 'true') {
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (window.confirm('Are you sure you want to delete this task?')) {
          handleDeleteTask(selectedTask.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTask]);


  // Add this handler in the Home component where other handlers are defined
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/deleteEventTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          taskId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Update local state to remove the task
      setSelectedEvent(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== taskId)
      }));

      // Clear selected task if it was the one deleted
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setSelectedTaskColumn(null);
      }

    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  };

  // Inside the Home component, add this effect after other useEffect hooks
  useEffect(() => {
    const handleTabNavigation = (e) => {
      // Check if not focused on input/textarea/contenteditable
      if (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      // Check for CMD/CTRL + SHIFT + Arrow Keys
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault(); // Always prevent default for this key combination
        
        const currentIndex = TABS.indexOf(currentTab);
        let newIndex;

        if (e.key === 'ArrowLeft') {
          // Move backwards, wrap to end if at start
          newIndex = currentIndex <= 0 ? TABS.length - 1 : currentIndex - 1;
        } else {
          // Move forwards, wrap to start if at end
          newIndex = currentIndex >= TABS.length - 1 ? 0 : currentIndex + 1;
        }

        const newTab = TABS[newIndex];
        router.push(`/event?eventId=${selectedEventId}&tab=${encodeURIComponent(newTab)}`);
      }
    };

    document.addEventListener('keydown', handleTabNavigation);
    return () => document.removeEventListener('keydown', handleTabNavigation);
  }, [currentTab, selectedEventId, router]);

  // Inside the Event component, add this state
  const [createEventForm, setCreateEventForm] = useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '17:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });


  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createEventError, setCreateEventError] = useState('');

  // Add this handler function
  const handleCreateFirstEvent = async (e) => {
    e.preventDefault();
    setCreateEventError('');
    setIsSubmitting(true);

    try {
      const startTime = `${createEventForm.startDate} ${createEventForm.startTime}:00`;
      const endTime = `${createEventForm.endDate} ${createEventForm.endTime}:00`;

      if (new Date(endTime) <= new Date(startTime)) {
        throw new Error('End time must be after start time');
      }

      // Round the times
      const { startTime: roundedStart, endTime: roundedEnd } = roundEventTimes(startTime, endTime);

      const response = await fetch('https://serenidad.click/hacktime/createEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          title: createEventForm.title,
          startTime,
          endTime,
          timezone: createEventForm.timezone
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      localStorage.setItem('lastVisited', data.id);
      window.location.href = `/event?eventId=${data.id}&tab=Run of Show`;

    } catch (error) {
      setCreateEventError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this state at the top of your component
  const [animatedText, setAnimatedText] = useState('');
  const [showGif, setShowGif] = useState(false);

  // Update the initial state
  const [showTutorial, setShowTutorial] = useState(false); // Start with false

  // Add this effect to update based on user data
  useEffect(() => {
    if (user) {
      setShowTutorial(!user.hasCompletedTutorial);
    }
  }, [user]); // Depend on user changes

  // Add this function to handle tutorial completion
  const completeTutorial = async () => {
    try {
      const response = await fetch('https://serenidad.click/hacktime/completeTutorial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark tutorial as complete');
      }
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  };

  // Update the close button handler
  const handleCloseTutorial = () => {
    setShowTutorial(false);
    completeTutorial();
  };
  const hasCalendarEvents = selectedEvent?.calendar_events?.length > 0;
  const hasNamedCalendarEvent = selectedEvent?.calendar_events?.some(event => event.title && event.title.trim() !== '');
  const hasTask = selectedEvent?.tasks?.length > 0;
  
  let initialText;
  // Update the useEffect to mark tutorial complete when it ends naturally
  useEffect(() => {

    if (hasTask) {
      initialText = "wonderful, you're a fast learner. You've got the basics down. It's now time to invite the rest of your team & organize your event.";
    } else if (hasNamedCalendarEvent) {
      initialText = "coolio. To create your first task, drag under the \"You\" column";
    } else if (hasCalendarEvents) {
      initialText = "alright... now type the name of the calendar event in & give it a tag & color if you'd like";
    } else {
      initialText = "Woo we made it!!! We have entered your Run of Show. Drag in the Event Schedule column to create a calendar event.";
    }

    // Don't start new animation if user is typing in an input
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.getAttribute('contenteditable') === 'true') {
      return;
    }

    let currentIndex = 0;
    let letterInterval;

    // Reset states when text changes
    setAnimatedText('');
    setShowGif(false);

    const startDelay = setTimeout(() => {
      letterInterval = setInterval(() => {
        if (currentIndex >= initialText.length) {
          clearInterval(letterInterval);
          
          if (hasTask) {
            // For final message, complete tutorial and hide it
            setTimeout(() => {
              completeTutorial(); // Call the API to mark tutorial as complete
              setShowTutorial(false);
            }, 5000);
          } else if (!hasCalendarEvents || hasNamedCalendarEvent) {
            setShowGif(true);
          }
          return;
        }
        setAnimatedText(initialText.slice(0, currentIndex + 1));
        currentIndex++;
      }, 35);
    }, 1500);

    return () => {
      clearTimeout(startDelay);
      clearInterval(letterInterval);
    };
  }, [selectedEvent?.calendar_events, selectedEvent?.tasks]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 500px)").matches);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Add these new state variables near the other state declarations
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editEventForm, setEditEventForm] = useState({
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: ''
  });
  const [editEventLoading, setEditEventLoading] = useState(false);
  const [editEventError, setEditEventError] = useState('');

  // Update the useEffect that initializes the edit form
  useEffect(() => {
    if (showEditEventModal && selectedEvent) {
      const startDate = new Date(selectedEvent.startTime);
      const endDate = new Date(selectedEvent.endTime);
      
      // Convert to 24-hour format for the time input
      const formatTimeForInput = (date) => {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };
      
      setEditEventForm({
        title: selectedEvent.title || '',
        startDate: startDate.toISOString().split('T')[0],
        startTime: formatTimeForInput(startDate),
        endDate: endDate.toISOString().split('T')[0],
        endTime: formatTimeForInput(endDate),
        timezone: selectedEvent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  }, [showEditEventModal, selectedEvent]);

  // Update the handleEditEvent function
  const handleEditEvent = async (e) => {
    e.preventDefault();
    setEditEventError('');
    setEditEventLoading(true);

    try {
      const startTime = `${editEventForm.startDate}T${editEventForm.startTime}:00.000Z`;
      const endTime = `${editEventForm.endDate}T${editEventForm.endTime}:00.000Z`;

      if (new Date(endTime) <= new Date(startTime)) {
        throw new Error('End time must be after start time');
      }

      // Round the times
      const { startTime: roundedStart, endTime: roundedEnd } = roundEventTimes(startTime, endTime);

      const response = await fetch('https://serenidad.click/hacktime/editEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: localStorage.getItem('token'),
          eventId: selectedEventId,
          title: editEventForm.title,
          startTime,
          endTime,
          timezone: editEventForm.timezone
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event');
      }

      // Update both selectedEvent and user's events
      setSelectedEvent(data);
      setUser(prevUser => ({
        ...prevUser,
        events: {
          ...prevUser.events,
          [selectedEventId]: {
            ...prevUser.events[selectedEventId],
            title: editEventForm.title,
            startTime: roundedStart,
            endTime: roundedEnd,
            timezone: editEventForm.timezone
          }
        }
      }));

      setShowEditEventModal(false);
      
      // Reload the page after successful edit
      window.location.reload();

    } catch (error) {
      setEditEventError(error.message);
    } finally {
      setEditEventLoading(false);
    }
  };

  useEffect(() => {
    // Set lowerNav to true if either selectedCalendarEvent or selectedTask exists
    setLowerNav(!!selectedCalendarEvent || !!selectedTask);
  }, [selectedCalendarEvent, selectedTask]);

  // Add these new states near the top with other state declarations
  const [venues, setVenues] = useState([]);
  const [addedToOutreach, setAddedToOutreach] = useState([]);
  const [venueSearchState, setVenueSearchState] = useState({
    selectedVenueTypes: [],
    isVenueDropdownOpen: false,
    userCity: timezoneToCity[Intl.DateTimeFormat().resolvedOptions().timeZone] || 'San Francisco',
    needsPadding: false,
    isGenerating: false,
    error: '',
    showError: false,
    loadingDots: '',
    searchText: ''
  });

  // Update the useEffect that loads from localStorage
  useEffect(() => {
    if (selectedEventId) {
      const savedCity = localStorage.getItem(`lastSearchCity_${selectedEventId}`);
      const savedPrompt = localStorage.getItem(`lastSearchPrompt_${selectedEventId}`);
      
      if (savedCity || savedPrompt) {
        setVenueSearchState(prev => ({
          ...prev,
          userCity: savedCity || prev.userCity,
          searchText: savedPrompt || prev.searchText
        }));
      }
    }
  }, [selectedEventId]);

  // Add the venue outreach handler
  const handleVenueOutreach = (venue) => {
    if (addedToOutreach.some(v => getVenueIdentifier(v) === getVenueIdentifier(venue))) {
      setAddedToOutreach(prev => prev.filter(v => 
        getVenueIdentifier(v) !== getVenueIdentifier(venue)
      ));
      return `${venue.name} Removed from Outreach`;
    } else {
      setAddedToOutreach(prev => [...prev, venue]);
      return `${venue.name} Added to Outreach`;
    }
  };

  // Add the venue search handler
  const handleVenueSearch = async () => {
    setVenueSearchState(prev => ({
      ...prev,
      showError: false,
      error: '',
      isGenerating: true
    }));

    if (!venueSearchState.searchText) {
      setVenueSearchState(prev => ({
        ...prev,
        error: 'Please describe your event needs',
        showError: true,
        isGenerating: false
      }));
      return;
    }

    if (venueSearchState.selectedVenueTypes.length === 0) {
      setVenueSearchState(prev => ({
        ...prev,
        error: 'Please select at least one venue type',
        showError: true,
        isGenerating: false
      }));
      return;
    }

    if (!venueSearchState.userCity.trim()) {
      setVenueSearchState(prev => ({
        ...prev,
        error: 'Please enter a city',
        showError: true,
        isGenerating: false
      }));
      return;
    }

    try {
      const response = await fetch('https://serenidad.click/hacktime/findVenues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generalRequest: venueSearchState.searchText,
          tags: venueSearchState.selectedVenueTypes.includes('all') 
            ? venueTypeOptions.map(type => type.toLowerCase()) 
            : venueSearchState.selectedVenueTypes.map(type => type.toLowerCase()),
          cityName: venueSearchState.userCity
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setVenues(data.data);
        
        // Reset search state but keep the searchText and city
        setVenueSearchState(prev => ({
          ...prev,
          selectedVenueTypes: ['all'],
          isGenerating: false
        }));
      } else {
        setVenueSearchState(prev => ({
          ...prev,
          error: 'Failed to find venues. Please try again.',
          showError: true,
          isGenerating: false
        }));
      }
    } catch (err) {
      console.error('Error generating venues:', err);
      setVenueSearchState(prev => ({
        ...prev,
        error: 'Something went wrong. Please try again.',
        showError: true,
        isGenerating: false
      }));
    }
  };

  // Add this useEffect to handle loading dots animation
  useEffect(() => {
    if (!venueSearchState.isGenerating) return;
    
    const interval = setInterval(() => {
      setVenueSearchState(prev => ({
        ...prev,
        loadingDots: prev.loadingDots === '...' ? '' : prev.loadingDots + '.'
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [venueSearchState.isGenerating]);

  if (loading) {
    return <div></div>;
  }

  return (
    <>
      <Head>
        <title>Always</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
<meta name="description" content=""/>

<meta property="og:url" content="https://always.sh/"/>
<meta property="og:type" content="website"/>
<meta property="og:title" content=""/>
<meta property="og:description" content=""/>
<meta property="og:image" content="https://opengraph.b-cdn.net/production/images/94a544e7-a5ba-4c45-98ca-49e926ce44b6.png?token=q8wbxEubxdaLUYDUCG6h2ZPJKc88QHFV2p8MTq5rg18&height=596&width=1200&expires=33267021068"/>

<meta name="twitter:card" content="summary_large_image"/>
<meta property="twitter:domain" content="always.sh"/>
<meta property="twitter:url" content="https://always.sh/"/>
<meta name="twitter:title" content=""/>
<meta name="twitter:description" content=""/>
<meta name="twitter:image" content="https://opengraph.b-cdn.net/production/images/94a544e7-a5ba-4c45-98ca-49e926ce44b6.png?token=q8wbxEubxdaLUYDUCG6h2ZPJKc88QHFV2p8MTq5rg18&height=596&width=1200&expires=33267021068"/>
      </Head>
      {!isMobile &&
      <div style={{width: "100%", height: "100vh", overflowY: tab == "Run of Show" ? "hidden" : "auto", display: "flex", flexDirection: "column"}}>
        
      {selectedEvent && getEventCount(user?.events) === 1 && showTutorial && !user?.hasCompletedTutorial && (
        <div style={{
          position: "fixed", 
          bottom: 54, 
          display: 'flex', 
          gap: 4, 
          flexDirection: "column", 
          right: 16, 
          backgroundColor: "#fff", 
          color: "#000", 
          paddingLeft: 12, 
          paddingRight: 12, 
          paddingTop: 12, 
          paddingBottom: 12, 
          border: "1px solid #EBEBEB", 
          width: 250, 
          zIndex: 99999999999998,
          borderRadius: 8,
          opacity: 1,
          transition: 'opacity 0.5s ease-out'
        }}>
<div style={{display: "flex", flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between", width: "100%"}}>
  <div style={{display: "flex", flexDirection: "row", alignItems: "center", gap: 8}}>
    <img 
      style={{height: 32, width: 32, objectFit: "cover", borderRadius: "100%", border:"1px solid #EBEBEB"}} 
      src={hasTask > 0 ? "dog-2.gif" :"./dog-1.gif"}
      loop={0}
    />
    <p style={{fontSize: 16, margin: 0}}>Always</p>
  </div>
  <button 
    onClick={handleCloseTutorial}
    style={{
      background: 'none',
      border: 'none',
      padding: '4px 8px',
      cursor: 'pointer',
      fontSize: '16px',
      color: '#8F8F8F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'background-color 0.2s ease',
      ':hover': {
        backgroundColor: '#F5F5F5'
      }
    }}
  >
    ✕
  </button>
</div>
          <p style={{
            margin: 0, 
            fontSize: 12,
            opacity: animatedText.length > 0 ? 1 : 0,
            transition: 'opacity 0.3s ease-in'
          }}>
            {animatedText}
          </p>
          {showGif && (
            <img 
              style={{
                maxWidth: "100%", 
                borderRadius: 8,
                animation: "fadeIn 0.5s ease-in-out"
              }} 
              src={selectedEvent?.calendar_events?.some(event => event.title && event.title.trim() !== '') 
                ? "./createTask.gif" 
                : "./createCalendarEvent.gif"
              }
            />
          )}
        </div>
      )}
              {isInvitingNewUser && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsInvitingNewUser(false);
                setInviteForm({ email: '', name: '', roleDescription: '' });
                setInviteError('');
                setInvalidEmail(false);
              }
            }}
            style={{
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              position: "fixed",
              zIndex: 99999999999999,
              height: "100vh",
              display: "flex",
              backgroundColor: "rgba(0, 0, 0, 0.5)"
            }}
          >
            <form onSubmit={handleFormSubmit} style={{maxWidth: 500, width: "100%", padding: 32, backgroundColor: "#fff", borderRadius: "8px"}}>
              <p style={{margin: 0, fontWeight: "bold", fontSize: "24px", marginBottom: "16px"}}>Invite to Run of Show</p>
              
              {inviteError && (
                <div style={{
                  color: 'red',
                  marginBottom: '16px',
                  padding: '8px',
                  backgroundColor: '#ffebee',
                  borderRadius: '4px'
                }}>
                  {inviteError}
                </div>
              )}

              <div style={{display: "flex", gap: "16px", marginBottom: "16px"}}>
                <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
                  <label style={{color: "gray", marginBottom: "8px", display: "block"}}>Email</label>
                  <input
                    ref={emailInputRef}
                    name="email"
                    value={inviteForm.email}
                    onChange={handleInviteChange}
                    placeholder="marsha@mellow.co"
                    style={{
                      padding: "8px",
                      border: `1px solid ${invalidEmail ? '#ff0000' : '#D0D7DE'}`,
                      borderRadius: "8px",
                      fontWeight: "400",
                      outline: "none",
                      backgroundColor: invalidEmail ? '#fff5f5' : 'white'
                    }}
                  />
                </div>

                <div style={{display: "flex", flexDirection: "column", width: "100%"}}>
                  <label style={{color: "gray", marginBottom: "8px", display: "block"}}>Name</label>
                  <input
                    name="name"
                    value={inviteForm.name}
                    onChange={handleInviteChange}
                    placeholder="Marsha Mellow"
                    style={{
                      padding: "8px",
                      border: "1px solid #D0D7DE",
                      borderRadius: "8px",
                      fontWeight: "400"
                    }}
                  />
                </div>
              </div>
              
              <div style={{marginBottom: "16px", display: "flex", flexDirection: "column"}}>
                <label style={{color: "gray", marginBottom: "8px", display: "block"}}>Title/Role (optional)</label>
                <input
                  name="roleDescription"
                  value={inviteForm.roleDescription}
                  onChange={handleInviteChange}
                  placeholder="operations lead"
                  style={{
                    padding: "8px",
                    border: "1px solid #D0D7DE",
                    borderRadius: "8px",
                    fontWeight: "400"
                  }}
                />
              </div>

              <button 
                type="submit"
                disabled={inviteLoading === true || (!inviteForm.email || !inviteForm.name)}
                style={{
                  width: "100%",
                  background: inviteLoading === 'sent' ? '#4CAF50' : // Green when sent
                             inviteLoading === true || (!inviteForm.email && !inviteForm.name) ? '#666' : 
                             'black',
                  color: "white",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: inviteLoading === true || (!inviteForm.email && !inviteForm.name) ? 'default' : 'pointer',
                  marginBottom: "16px",
                  transition: 'background-color 0.3s ease' // Smooth transition for color change
                }}
              >
                {inviteLoading === true ? "Sending..." : 
                 inviteLoading === 'sent' ? "Invite Sent!" : 
                 "Send Invitation"}
              </button>
            </form>
          </div>
        )}
 
        <Navigation 
          user={user}
          lowerNav={lowerNav}
          setShowEventDropdown={setShowEventDropdown}
          onUserUpdate={setUser}
          selectedEventId={selectedEventId}
          showCreateEventModal={showCreateEventModal}
          setShowCreateEventModal={setShowCreateEventModal}
          showEventDropdown={creatingEvent}
          onEventSelect={(id) => {
            console.log('Event selected:', id);
            setSelectedEventId(id);
          }}
          showEditEventModal={showEditEventModal}
          setShowEditEventModal={setShowEditEventModal}
          editEventForm={editEventForm}
          setEditEventForm={setEditEventForm}
          handleEditEvent={handleEditEvent}
          editEventLoading={editEventLoading}
          editEventError={editEventError}
        />

<div>
        {(selectedEvent != null && currentTab == "Run of Show") && 
               <RunOfShow
               handleColorUpdate={handleColorUpdate}
               lowerNav={lowerNav}
               setLowerNav={setLowerNav}
               selectedCalendarEvent={selectedCalendarEvent}
               handleDeleteCalendarEvent={handleDeleteCalendarEvent}
               handleDeleteConfirmation={handleDeleteConfirmation}
               MAX_DURATION={MAX_DURATION}
               isTimeOverlapping={isTimeOverlapping}
               setNewEventId={setNewEventId}
               handleEventTitleUpdate={handleEventTitleUpdate}
               selectedEventId={selectedEventId}
               animatingColor={animatingColor}
               isWithinEventBounds={isWithinEventBounds}
               selectedEvent={selectedEvent}
               newEventId={newEventId}
               setSelectedCalendarEvent={setSelectedCalendarEvent}
               user={user}
               titleInputRef={titleInputRef}
               setSelectedEvent={setSelectedEvent}
               selectedTask={selectedTask}
               setSelectedTask={setSelectedTask}
               selectedTaskColumn={selectedTaskColumn}
               setSelectedTaskColumn={setSelectedTaskColumn}
               editingTaskTitle={editingTaskTitle}
               setEditingTaskTitle={setEditingTaskTitle}
               editingTaskDescription={editingTaskDescription}
               setEditingTaskDescription={setEditingTaskDescription}
               handleTaskUpdate={handleTaskUpdate}
               handleDeleteTask={handleDeleteTask}
               setIsInvitingNewUser={setIsInvitingNewUser}
             />    
        }

        {(selectedEvent != null && currentTab == "Schedule") && 
        <ScheduleView
        selectedEvent={selectedEvent}
        selectedEventId={selectedEventId}
        setSelectedEvent={setSelectedEvent}
        selectedCalendarEvent={selectedCalendarEvent}
        setSelectedCalendarEvent={setSelectedCalendarEvent}
        setSelectedTask={setSelectedTask}
        newEventId={newEventId}
        setNewEventId={setNewEventId}
        handleDeleteConfirmation={handleDeleteConfirmation}
        handleEventTitleUpdate={handleEventTitleUpdate}
        handleTimeUpdate={handleTimeUpdate}
        handleDeleteCalendarEvent={handleDeleteCalendarEvent}
        handleColorUpdate={handleColorUpdate}
        animatingColor={animatingColor}
        COLORS={COLORS}
        MAX_DURATION={MAX_DURATION}
        isWithinEventBounds={isWithinEventBounds}
        isTimeOverlapping={isTimeOverlapping}
        timeStringToDate={timeStringToDate}
      />        }

        {(selectedEvent != null && currentTab == "Announcements") && 
          <AnnouncementView
          selectedEvent={selectedEvent}
          selectedEventId={selectedEventId}
          setSelectedEvent={setSelectedEvent}
          selectedCalendarEvent={selectedCalendarEvent}
          setSelectedCalendarEvent={setSelectedCalendarEvent}
          setSelectedTask={setSelectedTask}
          newEventId={newEventId}
          setNewEventId={setNewEventId}
          handleDeleteConfirmation={handleDeleteConfirmation}
          handleEventTitleUpdate={handleEventTitleUpdate}
          handleTimeUpdate={handleTimeUpdate}
          handleDeleteCalendarEvent={handleDeleteCalendarEvent}
          handleColorUpdate={handleColorUpdate}
          animatingColor={animatingColor}
          COLORS={COLORS}
          MAX_DURATION={MAX_DURATION}
          isWithinEventBounds={isWithinEventBounds}
          isTimeOverlapping={isTimeOverlapping}
          timeStringToDate={timeStringToDate}
          
          />
        }

      {(selectedEvent != null && currentTab == "Venue") && 
          <VenueView
          user={user}
            selectedEvent={selectedEvent}
            selectedEventId={selectedEventId}
            setSelectedEvent={setSelectedEvent}
            venues={venues}
            setVenues={setVenues}
            addedToOutreach={addedToOutreach}
            handleVenueOutreach={handleVenueOutreach}
            venueSearchState={venueSearchState}
            setVenueSearchState={setVenueSearchState}
            handleVenueSearch={handleVenueSearch}
            venueTypeOptions={venueTypeOptions}
          />
        }
        {(selectedEvent != null && currentTab == "Team") && 
          <TeamView
          setIsInvitingNewUser={setIsInvitingNewUser} // Add this prop

          selectedEvent={selectedEvent}
          selectedEventId={selectedEventId}
          setSelectedEvent={setSelectedEvent}
          selectedCalendarEvent={selectedCalendarEvent}
          setSelectedCalendarEvent={setSelectedCalendarEvent}
          setSelectedTask={setSelectedTask}
          newEventId={newEventId}
          setNewEventId={setNewEventId}
          handleDeleteConfirmation={handleDeleteConfirmation}
          handleEventTitleUpdate={handleEventTitleUpdate}
          handleTimeUpdate={handleTimeUpdate}
          handleDeleteCalendarEvent={handleDeleteCalendarEvent}
          handleColorUpdate={handleColorUpdate}
          animatingColor={animatingColor}
          COLORS={COLORS}
          MAX_DURATION={MAX_DURATION}
          isWithinEventBounds={isWithinEventBounds}
          isTimeOverlapping={isTimeOverlapping}
          timeStringToDate={timeStringToDate}
          
          />
        }
        {(selectedEvent == null) && 
          <WelcomeView
            createEventForm={createEventForm}
            setCreateEventForm={setCreateEventForm}
            handleCreateFirstEvent={handleCreateFirstEvent}
            createEventError={createEventError}
            isSubmitting={isSubmitting}
          />
        }
        </div>
      </div>}
      {isMobile && 
      <div style={{maxWidth: "100vw", flexDirection: "column", overflow: "hidden", paddingLeft: 16, paddingRight: 16, height: "100vh", display: "flex", justifyContent: "center", alignItems: "center"}}>
        <img style={{width: 256, height: 256}} src="./outline.gif"/>
        <p style={{fontSize: 24}}>Welcome to Always! to use always
        on your phone, download the
        always mobile app!</p>
        <button 
          style={{width: "100%", paddingTop: 12, paddingBottom: 12, backgroundColor: "#000", color: "#fff", borderRadius: 8, fontSize: 18}}
          onClick={() => window.location.href = 'https://apps.apple.com/us/app/always-sh/id6737702662'}
        >
          Download iOS App
        </button>
        <button disabled={true} style={{width: "100%", paddingTop: 12, paddingBottom: 12, backgroundColor: "#fff", border: "1px solid #000", opacity: 0.3, color: "#000", borderRadius: 8, fontSize: 18, marginTop: 24}}>Android App Coming Soon...</button>

      </div>}
      {/* {selectedEvent && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 8,
          alignItems: 'center'
        }}>
          <img
            src="/icons/settings.svg"
            alt="Settings"
            style={{
              width: 24,
              height: 24,
              cursor: 'pointer'
            }}
            onClick={() => setShowEditEventModal(true)}
          />
        </div>
      )} */}
      {showEditEventModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditEventModal(false);
              setEditEventError('');
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999999999999
          }}
        >
          <div style={{
            width: 500,
            backgroundColor: '#fff',
            borderRadius: 8,
            padding: 32
          }}>
            <h2 style={{ margin: '0 0 24px 0' }}>Edit Event</h2>
            
            {editEventError && (
              <div style={{
                color: 'red',
                marginBottom: '16px',
                padding: '8px',
                backgroundColor: '#ffebee',
                borderRadius: '4px'
              }}>
                {editEventError}
              </div>
            )}

            <form onSubmit={handleEditEvent} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column'
              }}>
                <label style={{
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Event Name
                </label>
                <input
                  type="text"
                  value={editEventForm.title}
                  onChange={(e) => setEditEventForm(prev => ({...prev, title: e.target.value}))}
                  required
                  style={{
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '1px solid #EBEBEB'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column'
              }}>
                <label style={{
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Timezone
                </label>
                <select
                  value={editEventForm.timezone}
                  onChange={(e) => setEditEventForm(prev => ({...prev, timezone: e.target.value}))}
                  required
                  style={{
                    padding: '8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: '1px solid #EBEBEB',
                    backgroundColor: '#fff'
                  }}
                >
                  <optgroup label="Common Timezones">
                    {Object.entries(commonTimezones).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Timezones">
                    {Intl.supportedValuesOf('timeZone').map(tz => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  <label style={{
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editEventForm.startDate}
                    onChange={(e) => setEditEventForm(prev => ({...prev, startDate: e.target.value}))}
                    required
                    style={{
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  <label style={{
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editEventForm.startTime}
                    onChange={(e) => setEditEventForm(prev => ({...prev, startTime: e.target.value}))}
                    required
                    style={{
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  <label style={{
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editEventForm.endDate}
                    onChange={(e) => setEditEventForm(prev => ({...prev, endDate: e.target.value}))}
                    required
                    style={{
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1'
                }}>
                  <label style={{
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editEventForm.endTime}
                    onChange={(e) => setEditEventForm(prev => ({...prev, endTime: e.target.value}))}
                    required
                    style={{
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={editEventLoading}
                style={{
                  padding: '12px',
                  fontSize: '16px',
                  backgroundColor: '#007AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: editEventLoading ? 'not-allowed' : 'pointer',
                  opacity: editEventLoading ? 0.7 : 1,
                  marginTop: '8px'
                }}
              >
                {editEventLoading ? 'Updating...' : 'Update Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
