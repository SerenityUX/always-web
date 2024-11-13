import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function GoogleCallback() {
  const router = useRouter();
  
  useEffect(() => {
    if (!router.isReady) return;

    console.log('Router Query:', router.query);
    console.log('Current URL:', window.location.href);
    console.log('Origin:', window.location.origin);
    console.log('Pathname:', window.location.pathname);

    const { code } = router.query;
    if (code) {
      console.log('Found authorization code');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Note that we're sending the request to serenidad.click
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
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Google Calendar connected:', data);
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'GOOGLE_CALENDAR_CONNECTED',
            expiryDate: data.expiryDate 
          }, window.location.origin);
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl mb-4">Connecting to Google Calendar...</h1>
        <p className="text-gray-600">Please wait while we complete the setup.</p>
      </div>
    </div>
  );
}