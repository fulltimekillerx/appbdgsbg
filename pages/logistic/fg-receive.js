import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase/client';

// The FGStock component handles the receiving of finished goods into stock.
const FGStock = ({ plant }) => {
  // Get user information from the authentication hook.
  const { user } = useAuth();
  
  // State variables for the form inputs, messages, and submission status.
  const [lmgNumber, setLmgNumber] = useState('');
  const [binLocation, setBinLocation] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // This useEffect hook automatically clears the success message after 5 seconds.
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // This function handles the form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Ensure a plant is selected before proceeding.
    if (!plant) {
      setError('No plant selected. Please select a plant before submitting.');
      setSubmitting(false);
      return;
    }

    // Check if the LMG number already exists in the fg_stock table.
    const { data: existingStock, error: existingStockError } = await supabase
        .from('fg_stock')
        .select('*')
        .eq('lmg_number', lmgNumber)
        .single();

    // Handle any errors during the check, except for the 'not found' error (PGRST116).
    if (existingStockError && existingStockError.code !== 'PGRST116') { 
        setError(existingStockError.message);
        setSubmitting(false);
        return;
    }

    // If the LMG number exists, update the stock location and record a movement.
    if (existingStock) {
        // Update the bin_location and timestamp for the existing stock.
        const { error: updateError } = await supabase
            .from('fg_stock')
            .update({ bin_location: binLocation, updated_at: new Date() })
            .eq('lmg_number', lmgNumber);

        if (updateError) {
            setError('Failed to update stock location: ' + updateError.message);
            setSubmitting(false);
            return;
        }

        // Record a movement of type '413' (location change).
        const { error: movementError } = await supabase.from('fg_stock_movements').insert({
            lmg_number: lmgNumber,
            movement_type: '413',
            initial_loc: existingStock.bin_location,
            destination_loc: binLocation,
            user_id: user?.user_metadata?.display_name || user?.email,
            plant: plant,
        });

        if (movementError) {
            setError('Failed to record stock movement: ' + movementError.message);
        } else {
            setMessage('Stock location updated and movement recorded.');
            setLmgNumber('');
            setBinLocation('');
        }

    } else {
        // If the LMG number does not exist, create a new stock entry and record a movement.
        const { error: insertError } = await supabase.from('fg_stock').insert({
            lmg_number: lmgNumber,
            bin_location: binLocation,
            user_id: user?.user_metadata?.display_name || user?.email,
            plant: plant,
        });

        if (insertError) {
            setError('Failed to add new stock: ' + insertError.message);
            setSubmitting(false);
            return;
        }

        // Record a movement of type '101' (initial stock receipt).
        const { error: movementError } = await supabase.from('fg_stock_movements').insert({
            lmg_number: lmgNumber,
            movement_type: '101',
            destination_loc: binLocation,
            user_id: user?.user_metadata?.display_name || user?.email,
            plant: plant,
        });

        if (movementError) {
            setError('Stock created, but failed to record movement: ' + movementError.message);
        } else {
            setMessage('New stock received and movement recorded.');
            setLmgNumber('');
            setBinLocation('');
        }
    }

    setSubmitting(false);
};

  // This section renders the form for receiving finished goods.
  return (
    <div>
      <h2>FG Stock</h2>
      {message && <p className="message-success">{message}</p>}
      {error && <p className="message-error">{error}</p>}
      
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label htmlFor="binLocation">Bin Location</label>
          <input
            type="text"
            id="binLocation"
            value={binLocation}
            onChange={(e) => setBinLocation(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="lmgNumber">LMG Number</label>
          <input
            type="text"
            id="lmgNumber"
            value={lmgNumber}
            onChange={(e) => setLmgNumber(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default FGStock;
