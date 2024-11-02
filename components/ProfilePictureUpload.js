import { useRef } from 'react';

export default function ProfilePictureUpload({ onUpload, children }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);
    formData.append('token', localStorage.getItem('token'));

    try {
      const response = await fetch('https://serenidad.click/hacktime/changeProfilePicture', {
        method: 'POST',
        body: formData,
      });

    //   if (!response.ok) {
    //     throw new Error('Upload failed');
    //   }

      const data = await response.json();
      onUpload(data.profilePictureUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload profile picture');
    }

    // Clear the input
    event.target.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div onClick={() => fileInputRef.current?.click()}>
        {children}
      </div>
    </>
  );
} 