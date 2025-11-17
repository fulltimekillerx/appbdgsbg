
import React, { useState } from 'react';
import { supabase } from '../supabase/client';

const OpnameReport = () => {
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().slice(0, 10));
  const [binLocation, setBinLocation] = useState('');
  const [opnamedRolls, setOpnamedRolls] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!opnameDate) {
      alert('Please select a date.');
      return;
    }

    setLoading(true);
    setOpnamedRolls([]);

    try {
      const startDate = `${opnameDate}T00:00:00.000Z`;
      const endDate = `${opnameDate}T23:59:59.999Z`;

      let query = supabase
        .from('paper_rolls')
        .select('*')
        .gte('opname_date', startDate)
        .lte('opname_date', endDate)
        .order('opname_date', { ascending: false });

      if (binLocation) {
        query = query.ilike('opname_bin_location', `%${binLocation}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const rolls = data.map(roll => {
        const goodsReceiveDate = roll.goods_receive_date ? new Date(roll.goods_receive_date) : null;
        const aging = goodsReceiveDate ? Math.floor((new Date() - goodsReceiveDate) / (1000 * 60 * 60 * 24)) : 'N/A';

        return {
          ...roll,
          opname_date: new Date(roll.opname_date).toLocaleDateString(),
          goods_receive_date: goodsReceiveDate ? goodsReceiveDate.toLocaleDateString() : 'N/A',
          aging: aging,
        };
      });

      setOpnamedRolls(rolls);
    } catch (error) {
      console.error('Error searching opnamed rolls:', error);
      alert('Failed to fetch opname report. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Opname Report</h1>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Opname Date:
          <input
            type="date"
            value={opnameDate}
            onChange={e => setOpnameDate(e.target.value)}
            style={{ marginLeft: '5px' }}
          />
        </label>
        <label style={{ marginRight: '10px' }}>
          Search by Bin Location:
          <input
            type="text"
            value={binLocation}
            onChange={e => setBinLocation(e.target.value)}
            style={{ marginLeft: '5px' }}
          />
        </label>
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {loading ? (
        <p>Loading report...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>Opname Date</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Roll ID</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Kind</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>GSM</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Width</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Diameter</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Weight</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Batch</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Goods Receive Date</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Aging</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Bin Location</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Opname Bin Location</th>
            </tr>
          </thead>
          <tbody>
            {opnamedRolls.length > 0 ? (
              opnamedRolls.map(roll => (
                <tr key={roll.id}>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.opname_date}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.roll_id}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.kind}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.gsm}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.width}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.diameter}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.weight}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.batch_number}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.goods_receive_date}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.aging}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.bin_location}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.opname_bin_location}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '20px' }}>
                  No rolls found for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OpnameReport;
