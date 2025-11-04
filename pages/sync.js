import React from 'react';

export default function Sync() {
  const handleSync = () => {
    // Implement the sync logic here
    console.log('Syncing...');
  };

  return (
    <div>
      <h1>Sync</h1>
      <button onClick={handleSync}>Sync Now</button>
    </div>
  );
}
