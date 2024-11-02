export default function ProfileImage({ imageUrl, name, size = 32 }) {
  if (!name) {
    console.warn('ProfileImage component requires a name prop');
    return null;
  }

  const firstChar = name.charAt(0).toUpperCase();
  const fontSize = Math.floor(size * 0.5); // Scale font size relative to container

  if (!imageUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: '#DCDCDC',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${fontSize}px`,
          color: '#B4B4B4',
          fontWeight: 400,
        }}
      >
        {firstChar}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '50%',
      }}
    />
  );
} 