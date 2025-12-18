import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../hooks/useAuth';

const PRMovement = ({ plant }) => {
  const [rollId, setRollId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth() || {};

  const handleMovement = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!user) {
      setError('You must be logged in to move stock.');
      return;
    }
    if (!plant) {
        setError('Plant information is not available.');
        return;
    }

    try {
      const { data: stockData, error: stockError } = await supabase
        .from('pr_stock')
        .select('*')
        .eq('roll_id', rollId)
        .eq('plant', plant)
        .single();

      if (stockError || !stockData) {
        throw new Error(`Roll ID ${rollId} not found in plant ${plant}.`);
      }

      const { error: movementError } = await supabase.from('pr_stock_movements').insert([
        {
          roll_id: rollId,
          plant: plant,
          movement_type: '999',
          initial_loc: stockData.bin_location,
          destination_loc: newLocation,
          weight: stockData.weight,
          diameter: stockData.diameter,
          length: stockData.length,
          prod_order_no: stockData.prod_order_no,
          user_id: user.user_metadata.display_name || user.email,
        },
      ]);

      if (movementError) {
        throw movementError;
      }

      const { error: updateError } = await supabase
        .from('pr_stock')
        .update({ bin_location: newLocation })
        .eq('roll_id', rollId)
        .eq('plant', plant);

      if (updateError) {
        throw updateError;
      }

      setMessage('Movement successful!');
      setRollId('');
      setNewLocation('');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h2>Paper Roll Movement</h2>
      {message && <p className="message-success">{message}</p>}
      {error && <p className="message-error">{error}</p>}

      <form onSubmit={handleMovement} className="form-grid">
        <div className="form-group">
          <label htmlFor="rollId">Roll ID:</label>
          <input
            id="rollId"
            type="text"
            value={rollId}
            onChange={(e) => setRollId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="newLocation">New Location:</label>
          <input
            id="newLocation"
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            required
          />
        </div>
        <button type="submit">Move Roll</button>
      </form>
    </div>
  );
};

export default PRMovement;
