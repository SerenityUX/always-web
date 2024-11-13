import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const GoogleCallback = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    if (!router.isReady) return;

    const { code } = router.query;
    if (code) {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('Error: No authentication token found');
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
          window.opener.postMessage({ 
            type: 'GOOGLE_CALENDAR_CONNECTED',
            expiryDate: data.expiryDate 
          }, window.location.origin);
          window.close();
        }
      })
      .catch(error => {
        setStatus(`Error: ${error.message}`);
      });
    }
  }, [router.isReady, router.query]);

  return (
    <div>
      <h1>{status}</h1>
      <p>Please wait while we complete the setup...</p>
    </div>
  );
};

export default GoogleCallback;