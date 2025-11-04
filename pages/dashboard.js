import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const querySnapshot = await getDocs(collection(db, 'paper_rolls'));
      const rolls = querySnapshot.docs.map(doc => doc.data());
      
      // Calculate summary data
      const totalRolls = rolls.length;
      const totalWeight = rolls.reduce((acc, roll) => acc + roll.weight, 0);
      const rollsByStatus = rolls.reduce((acc, roll) => {
        acc[roll.status] = (acc[roll.status] || 0) + 1;
        return acc;
      }, {});

      setSummary({ totalRolls, totalWeight, rollsByStatus });
    };

    fetchSummary();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {summary ? (
        <div>
          <p>Total Rolls: {summary.totalRolls}</p>
          <p>Total Weight: {summary.totalWeight} kg</p>
          <h3>Rolls by Status:</h3>
          <ul>
            {Object.entries(summary.rollsByStatus).map(([status, count]) => (
              <li key={status}>{status}: {count}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
