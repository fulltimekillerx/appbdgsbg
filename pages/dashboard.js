

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const { data: rolls, error } = await supabase.from('paper_rolls').select('weight');

      if (error) {
        console.error('Error fetching summary:', error);
        setError(error.message);
        return;
      }
      
      // Calculate summary data
      const totalRolls = rolls.length;
      const totalWeight = rolls.reduce((acc, roll) => acc + roll.weight, 0);

      setSummary({ totalRolls, totalWeight });
    };

    fetchSummary();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {summary ? (
        <div>
          <p>Total Rolls: {summary.totalRolls}</p>
          <p>Total Weight: {summary.totalWeight.toFixed(2)} kg</p>
        </div>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
