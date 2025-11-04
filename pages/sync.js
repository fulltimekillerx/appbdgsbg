import React from 'react';
// import { useOfflineQueue } from '../hooks/useOfflineQueue';

export default function Sync() {
  // const { queue, retryAll, clearQueue } = useOfflineQueue();

  return (
    <div>
      <h1>Sync Queue</h1>
      {/* <button onClick={retryAll}>Retry All</button>
      <button onClick={clearQueue}>Clear Queue</button>
      <ul>
        {queue.map((item) => (
          <li key={item.id}>
            <p>Action: {item.action}</p>
            <p>Roll ID: {item.roll_id}</p>
            <p>Timestamp: {new Date(item.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul> */}
    </div>
  );
}
