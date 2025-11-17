
import React, { useState } from 'react';
import { supabase } from '../supabase/client';

const StockOpname = () => {
  const [binLocation, setBinLocation] = useState('');
  const [isBinLocked, setIsBinLocked] = useState(false);
  const [rollId, setRollId] = useState('');
  const [scannedRolls, setScannedRolls] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRollScan = async () => {
    if (!rollId) {
      setMessage('Please enter a Roll ID.');
      return;
    }
    if (!isBinLocked || !binLocation) {
        setMessage('Please lock a bin location before scanning.');
        return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const { data: existingRoll, error: fetchError } = await supabase
        .from('paper_rolls')
        .select('*')
        .eq('roll_id', rollId)
        .single();

      // PGRST116 means no row was found, which is not an error in this case.
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingRoll) {
        const { error: updateError } = await supabase
          .from('paper_rolls')
          .update({
            opname_date: new Date().toISOString(),
            opname_bin_location: binLocation,
          })
          .eq('id', existingRoll.id);

        if (updateError) {
          throw updateError;
        }
        
        setScannedRolls(prev => [existingRoll, ...prev]);
        setMessage(`Roll ID ${rollId} scanned and updated successfully.`);
      } else {
        // If the roll is not in the master list, just add it to the local scanned list for tracking.
        setMessage(`Roll ID ${rollId} not found in master data, but recorded in this session.`);
        const newRoll = {
          id: `new-${rollId}-${Date.now()}`,
          roll_id: rollId,
          kind: 'N/A',
          gsm: 'N/A',
          width: 'N/A',
        };
        setScannedRolls(prev => [newRoll, ...prev]);
      }

      setRollId('');

    } catch (error) {
      console.error('Error scanning roll:', error);
      setMessage(`Error scanning roll: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleRollScan();
    }
  };

  const toggleLock = () => {
      if (!binLocation) {
          setMessage("Please enter a bin location before locking.");
          return;
      }
      setIsBinLocked(!isBinLocked);
      setMessage('');
  }

  return (
    <div>
      <h1>Stock Opname</h1>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Bin Location:
          <input
            type="text"
            value={binLocation}
            onChange={e => setBinLocation(e.target.value)}
            disabled={isBinLocked}
            style={{ marginLeft: '5px' }}
          />
        </label>
        <button onClick={toggleLock}>
          {isBinLocked ? 'Change Bin Location' : 'Lock Bin'}
        </button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          Scan Roll ID:
          <input
            type="text"
            value={rollId}
            onChange={e => setRollId(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isBinLocked || isSubmitting}
            placeholder={isBinLocked ? 'Scan here' : 'Lock bin first'}
            style={{ marginLeft: '5px' }}
          />
        </label>
        <button onClick={handleRollScan} disabled={!isBinLocked || isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
      {message && <p>{message}</p>}
      <h2>Scanned Rolls in this Session</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px' }}>Roll ID</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Kind</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>GSM</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Width</th>
          </tr>
        </thead>
        <tbody>
          {scannedRolls.length > 0 ? (
            scannedRolls.map(roll => (
              <tr key={roll.id}>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.roll_id}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.kind}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.gsm}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{roll.width}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                No rolls scanned yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StockOpname;
