import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function History() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const querySnapshot = await getDocs(collection(db, 'movement_logs'));
      const logs = querySnapshot.docs.map(doc => doc.data());
      setLogs(logs);
    };

    fetchLogs();
  }, []);

  return (
    <div>
      <h1>Movement History</h1>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>
            <p>Roll ID: {log.roll_id}</p>
            <p>Action: {log.action}</p>
            <p>Timestamp: {new Date(log.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
