import Head from "next/head";
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Navigation from '../components/Navigation';
import { TaskCard } from '../components/TaskCard';
import { ScheduleView } from '../components/ScheduleView';
import { RunOfShow } from '../components/RunOfShow';
import { AnnouncementView } from "@/components/AnnouncementView";
import { TeamView } from "@/components/TeamView";



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
const TABS = ["Run of Show", "Schedule", "Announcements", "Team"];

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

export default function Event() {
  const router = useRouter();
  const { tab, eventId } = router.query;
  const currentTab = tab || "Run of Show";

  const [creatingEvent, setShowEventDropdown] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);


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

  useEffect(() => {
    async function authenticate() {
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
         // If organizationEvents exists, process and merge with events
         if (userData.organizationEvents) {
          // Create a map of event IDs that the user owns/is member of
          const userEventIds = new Set(Object.keys(userData.events || {}));
          
          // Process organization events
          const processedOrgEvents = Object.entries(userData.organizationEvents).reduce((acc, [id, event]) => {
            acc[id] = {
              ...event,
              // Add notMemberOrOwner flag if the event isn't in user's events
              notMemberOrOwner: !userEventIds.has(id)
            };
            return acc;
          }, {});
          
          // Replace events with processed organization events
          userData.events = processedOrgEvents;
        }

        const eventIds = Object.keys(userData.events);

        setUser(userData);
        setLoading(false);

        if (!router.query.eventId && eventIds.length > 0) {
          const lastVisited = localStorage.getItem('lastVisited');
          const targetEventId = lastVisited && eventIds.includes(lastVisited) 
            ? lastVisited 
            : eventIds[0];
            
          const urlParams = new URLSearchParams(window.location.search);
          const tabParam = urlParams.get('tab') ? `&tab=${urlParams.get('tab')}` : '&tab=Run of Show';
          await router.push(`/event?eventId=${targetEventId}${tabParam}`);
          setSelectedEventId(targetEventId);
          setSelectedEvent(userData.events[targetEventId]);
          localStorage.setItem('lastVisited', targetEventId);
        } else if (router.query.eventId && eventIds.includes(router.query.eventId)) {
          setSelectedEventId(router.query.eventId);
          setSelectedEvent(userData.events[router.query.eventId]);
          localStorage.setItem('lastVisited', router.query.eventId);
        }
      } catch (error) {
        router.push('/signup');
      }
    }

    authenticate();
  }, []);

  useEffect(() => {
    if (user && eventId && user.events[eventId]) {
      setSelectedEventId(eventId);
      setSelectedEvent(user.events[eventId]);
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
    setInviteError('');
    setInvalidEmail(false);

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
          id: data.user.email, // Using email as ID
          name: data.user.name,
          email: data.user.email,
          roleDescription: data.user.roleDescription,
          profilePicture: data.user.profilePicture
        }]
      }));

      // Close the invite modal
      setIsInvitingNewUser(false);
    } catch (error) {
      setInviteError(error.message);
    } finally {
      setInviteLoading(false);
    }
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
        document.activeElement.tagName !== 'TEXTAREA'
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
          zIndex: 2, 
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
        <Navigation 
          user={user}
          setShowEventDropdown={setShowEventDropdown}
          onUserUpdate={setUser}
          selectedEventId={selectedEventId}
          showCreateEventModal={showCreateEventModal}
          setShowCreateEventModal={setShowCreateEventModal}
          showEventDropdown={creatingEvent}
          // onEventSelect={handleEventSelect}
          onEventSelect={(id) => {
            console.log('Event selected:', id);
            setSelectedEventId(id);
          }}
        />
<div>
        {(selectedEvent != null && currentTab == "Run of Show") && 
               <RunOfShow
               handleColorUpdate={handleColorUpdate}
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
        {(selectedEvent == null)&& 

        <div style={{
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          color: "#59636E", 
          textAlign: "center", gap: 16,
          flexDirection: "column"
        }}>
        <img style={{height: 128, marginTop: 24, width: 128}} src="./outline.gif"/>
        <p style={{margin: 0}}>welcome to <span style={{fontWeight: 700, color: "#000"}}>always</span>, let's get started<br/></p>
        {/* <p
        onClick={() => setShowCreateEventModal(true)}
        style={{color: "#0293D4", cursor: "pointer", textDecoration: "underline"}}>create your first event</p>
         */}
         <div style={{width: 500, textAlign: "left", display: "flex", flexDirection: "column", padding: 32, marginTop: 24, borderRadius: 8, border: "1px solid #EBEBEB", backgroundColor: "#fff"}}>
          
          {createEventError && (
            <div style={{
              color: 'red',
              marginBottom: '16px',
              padding: '8px',
              backgroundColor: '#ffebee',
              borderRadius: '4px'
            }}>
              {createEventError}
            </div>
          )}

          <form onSubmit={handleCreateFirstEvent} style={{
            display: 'flex',
            flexDirection: 'column',
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
                Event Name
              </label>
              <input
                type="text"
                value={createEventForm.title}
                onChange={(e) => setCreateEventForm(prev => ({...prev, title: e.target.value}))}
                required
                style={{
                  flex: '1',
                  padding: '8px',
                  fontSize: '16px',
                  borderRadius: '4px',
                  border: '1px solid #EBEBEB'
                }}
              />
            </div>
            {(createEventForm.title != "" && createEventForm.title != null) &&   
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: '1',
                animation: 'fadeIn 0.3s ease-in-out'
              }}
            >
              <style jsx>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <label style={{
                marginBottom: '8px', 
                fontSize: '14px'
              }}>
                Timezone
              </label>
              <select
                value={createEventForm.timezone}
                onChange={(e) => setCreateEventForm(prev => ({...prev, timezone: e.target.value}))}
                required
                style={{
                  flex: '1',
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
            </div>}
            {(createEventForm.title != "" && createEventForm.title != null) &&   

            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                animation: 'fadeIn 0.3s ease-in-out',
                animationDelay: '0.1s', // Slight delay for staggered effect
                opacity: 0, // Start hidden
                animationFillMode: 'forwards' // Keep final state
              }}
            >
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
                    value={createEventForm.startDate}
                    onChange={(e) => setCreateEventForm(prev => ({...prev, startDate: e.target.value}))}
                    required
                    style={{
                      flex: '1',
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
                    value={createEventForm.startTime}
                    onChange={(e) => setCreateEventForm(prev => ({...prev, startTime: e.target.value}))}
                    required
                    style={{
                      flex: '1',
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
                    value={createEventForm.endDate}
                    onChange={(e) => setCreateEventForm(prev => ({...prev, endDate: e.target.value}))}
                    required
                    style={{
                      flex: '1',
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
                    value={createEventForm.endTime}
                    onChange={(e) => setCreateEventForm(prev => ({...prev, endTime: e.target.value}))}
                    required
                    style={{
                      flex: '1',
                      padding: '8px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      border: '1px solid #EBEBEB'
                    }}
                  />
                </div>
              </div>
            </div>}

            <button
              type="submit"
              disabled={(createEventForm.title == "" || createEventForm.title == null) || isSubmitting}
              style={{
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (createEventForm.title == "" || createEventForm.title == null) || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: (createEventForm.title == "" || createEventForm.title == null) || isSubmitting ? 0.7 : 1,
                marginTop: '8px',
                animation: "* 0.3 ease-in"
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create First Event'}
            </button>
          </form>
          </div>
        </div>
        }
        </div>
      </div>
    </>
  );
}
