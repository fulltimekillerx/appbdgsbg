import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';

export default function Dashboard({ plant }) {
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!plant) return;

      try {
        setLoading(true);
        let allRolls = [];
        let page = 0;
        const pageSize = 1000;
        let lastPage = false;

        while (!lastPage) {
          const { data, error } = await supabase
            .from('pr_stock')
            .select('batch, weight, goods_receive_date')
            .eq('plant', plant)
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) {
            throw error;
          }

          if (data) {
            allRolls = [...allRolls, ...data];
          }

          if (!data || data.length < pageSize) {
            lastPage = true;
          }
          
          page++;
        }
        
        const batchSummary = allRolls.reduce((acc, roll) => {
          const batch = roll.batch || 'N/A';
          if (!acc[batch]) {
            acc[batch] = {
              totalRolls: 0,
              totalWeight: 0,
              totalAge: 0,
              countForAge: 0,
            };
          }

          acc[batch].totalRolls += 1;
          acc[batch].totalWeight += roll.weight;
          
          if (roll.goods_receive_date) {
            const creationDate = new Date(roll.goods_receive_date);
            const ageInDays = (new Date() - creationDate) / (1000 * 60 * 60 * 24);
            acc[batch].totalAge += ageInDays;
            acc[batch].countForAge += 1;
          }
          
          return acc;
        }, {});

        const summaryArray = Object.keys(batchSummary).map(batch => ({
          batch,
          totalRolls: batchSummary[batch].totalRolls,
          totalWeight: batchSummary[batch].totalWeight,
          averageAge: batchSummary[batch].countForAge > 0 
            ? batchSummary[batch].totalAge / batchSummary[batch].countForAge
            : 0,
        }));

        setSummary(summaryArray);
      } catch (error) {
        console.error('Error fetching summary:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [plant]);

  return (
    <div>
      <h1>Paper Roll Dashboard for {plant}</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Total Rolls</th>
              <th>Total Weight (kg)</th>
              <th>Average Aging (days)</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((item) => (
              <tr key={item.batch}>
                <td>{item.batch}</td>
                <td>{item.totalRolls}</td>
                <td>{item.totalWeight.toFixed(2)}</td>
                <td>{item.averageAge.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <style jsx>{`
        table, th, td {
          border: 1px solid black;
          border-collapse: collapse;
          padding: 8px;
        }
        table {
          width: 100%;
          margin-top: 1rem;
        }
        th {
          background-color: #f2f2f2;
        }
      `}</style>
    </div>
  );
}
