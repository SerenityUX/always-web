import { useEffect } from 'react';
import { useRouter } from 'next/router';

function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { code } = router.query;
    if (code) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      fetch('https://serenidad.click/hacktime/connectGoogleCalendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          token
        }),
      })
      .then(response => response.json())
      .then(data => {
        if (window.opener) {
          // First, tell the opener to refresh
          window.opener.postMessage({ 
            type: 'GOOGLE_CALENDAR_CONNECTED',
            expiryDate: data.expiryDate 
          }, window.location.origin);
          
          // Then refresh the opener window
          window.opener.location.reload();
          
          // Finally, close this popup
          window.close();
        }
      })
      .catch(error => {
        console.error('Failed to connect calendar:', error);
        alert('Failed to connect Google Calendar. Please try again.');
      });
    }
  }, [router.isReady, router.query]);

  return (
    <div>
      <h1>Connecting to Google Calendar...</h1>
      <p>Please wait while we complete the setup.</p>
    </div>
  );
}

export default GoogleCallback;