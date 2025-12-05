
import React, { useState } from 'react';
import { supabase } from '../../supabase/client';

const OpnameReport = () => {
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().slice(0, 10));
  const [binLocation, setBinLocation] = useState('');
  const [opnamedRolls, setOpnamedRolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!opnameDate) {
      alert('Please select a date.');
      return;
    }

    setLoading(true);
    setOpnamedRolls([]);
    setMessage('');

    try {
      const startDate = `${opnameDate}T00:00:00.000Z`;
      const endDate = `${opnameDate}T23:59:59.999Z`;

      let query = supabase
        .from('pr_stock_opname_events')
        .select(`
          id,
          opname_at,
          roll_id,
          bin_location,
          paper_roll_id,
          user:user_id(raw_user_meta_data)
        `)
        .gte('opname_at', startDate)
        .lte('opname_at', endDate)
        .order('opname_at', { ascending: false });

      if (binLocation) {
        query = query.ilike('bin_location', `%${binLocation}%`);
      }

      const { data: eventsData, error: eventsError } = await query;

      if (eventsError) {
        throw eventsError;
      }

      const rollIds = [...new Set(eventsData.map(e => e.paper_roll_id).filter(id => id))];

      let rollsMap = new Map();
      if (rollIds.length > 0) {
          const { data: rollsData, error: rollsError } = await supabase
            .from('paper_rolls')
            .select('roll_id, kind, gsm, width, diameter, weight, batch, goods_receive_date, bin_location')
            .in('roll_id', rollIds);

          if (rollsError) {
              throw rollsError;
          }
          rollsMap = new Map(rollsData.map(r => [r.roll_id, r]));
      }


      const events = eventsData.map(event => {
        const roll = rollsMap.get(event.paper_roll_id);
        
        if (!roll) {
          return {
            id: event.id,
            opname_at: new Date(event.opname_at).toLocaleString(),
            scanned_roll_id: event.roll_id,
            scanned_bin_location: event.bin_location,
            user_name: event.user.raw_user_meta_data.display_name || 'N/A',
            kind: 'N/A',
            gsm: 'N/A',
            width: 'N/A',
            diameter: 'N/A',
            weight: 'N/A',
            batch: 'N/A',
            goods_receive_date: 'N/A',
            aging: 'N/A',
            master_bin_location: 'N/A',
          };
        }

        const goodsReceiveDate = roll.goods_receive_date ? new Date(roll.goods_receive_date) : null;
        const aging = goodsReceiveDate ? Math.floor((new Date() - goodsReceiveDate) / (1000 * 60 * 60 * 24)) : 'N/A';

        return {
          id: event.id,
          opname_at: new Date(event.opname_at).toLocaleString(),
          scanned_roll_id: event.roll_id,
          scanned_bin_location: event.bin_location,
          user_name: event.user.raw_user_meta_data.display_name || 'N/A',
          kind: roll.kind,
          gsm: roll.gsm,
          width: roll.width,
          diameter: roll.diameter,
          weight: roll.weight,
          batch: roll.batch,
          goods_receive_date: goodsReceiveDate ? goodsReceiveDate.toLocaleDateString() : 'N/A',
          aging: aging,
          master_bin_location: roll.bin_location,
        };
      });

      setOpnamedRolls(events);
    } catch (error) {
      console.error('Error searching opnamed rolls:', error);
      alert('Failed to fetch opname report. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId, roll_id) => {
    setMessage('');
    const isConfirmed = window.confirm(`Are you sure you want to delete this scan for Roll ID ${roll_id}?`);
    if (!isConfirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pr_stock_opname_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        throw error;
      }

      setOpnamedRolls(prev => prev.filter(roll => roll.id !== eventId));
      setMessage(`Scan for Roll ID ${roll_id} deleted successfully.`);

    } catch (error) {
      console.error('Error deleting scan:', error);
      setMessage(`Error deleting scan: ${error.message || 'Please try again.'}`);
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
      {message && <p>{message}</p>}
      {loading ? (
        <p>Loading report...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>Scanned At</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Scanned By</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Scanned Roll ID</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Kind</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>GSM</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Width</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Diameter</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Weight</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Batch</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Goods Receive Date</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Aging</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Master Bin Location</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Scanned Bin Location</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {opnamedRolls.length > 0 ? (
              opnamedRolls.map(roll => (
                <tr key={roll.id}>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.opname_at}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.user_name}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.scanned_roll_id}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.kind}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.gsm}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.width}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.diameter}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.weight}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.batch}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.goods_receive_date}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.aging}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.master_bin_location}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>{roll.scanned_bin_location}</td>
                  <td style={{ border: '1px solid black', padding: '8px' }}>
                    <button onClick={() => handleDelete(roll.id, roll.scanned_roll_id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="14" style={{ textAlign: 'center', padding: '20px' }}>
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
