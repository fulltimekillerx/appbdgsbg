import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../hooks/useAuth';

const PRIssue = ({ plant }) => { // Accept plant as a prop
  const router = useRouter();
  const [machineNumber, setMachineNumber] = useState('C1');
  const [isMachineLocked, setIsMachineLocked] = useState(false);
  const [unitName, setUnitName] = useState('CL');
  const [rollId, setRollId] = useState('');
  const [productionRolls, setProductionRolls] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth() || {}; // Safely destructure user

  // Fetches rolls that are currently at the selected production destination for the current plant
  const fetchProductionRolls = async () => {
    if (!plant) return;
    const destination = `${machineNumber} - ${unitName}`;
    const { data, error } = await supabase
      .from('pr_stock')
      .select('*')
      .eq('bin_location', destination)
      .eq('plant', plant); // Use plant in query

    if (error) {
      setError(`Failed to fetch production rolls: ${error.message}`);
    } else {
      setProductionRolls(data);
    }
  };

  // This useEffect runs when the component mounts or when machine, unit, or plant changes
  useEffect(() => {
    if (machineNumber && unitName && plant) {
      fetchProductionRolls();
    }
  }, [machineNumber, unitName, plant]);

  const handleConsume = async (e) => {
    e.preventDefault();
    if (!rollId) {
      setError('Please enter a Roll ID.');
      return;
    }
    if (!user) {
      setError('You must be logged in to consume rolls.');
      return;
    }
    if (!plant) {
        setError('Error: Plant information is not available.');
        return;
    }

    setMessage('');
    setError('');

    try {
      // 1. Fetch the roll from pr_stock for the specific plant
      const { data: stockData, error: fetchError } = await supabase
        .from('pr_stock')
        .select('*')
        .eq('roll_id', rollId)
        .eq('plant', plant) // Use plant in query
        .single();

      if (fetchError || !stockData) {
        throw new Error(`Roll ID ${rollId} not found in plant ${plant}.`);
      }

      const destination = `${machineNumber} - ${unitName}`;

      // 2. Insert into pr_stock_movements, including the plant
      const { error: movementError } = await supabase.from('pr_stock_movements').insert([
        {
          roll_id: stockData.roll_id,
          plant: plant, // Record plant
          movement_type: '201', // Issue to production
          initial_loc: stockData.bin_location,
          destination_loc: destination,
          weight: stockData.weight,
          diameter: stockData.diameter,
          length: stockData.length,
          prod_order_no: stockData.prod_order_no,
          user_id: user.user_metadata.display_name || user.email,
        },
      ]);

      if (movementError) {
        throw new Error(`Failed to record movement: ${movementError.message}`);
      }

      // 3. Update the bin_location in pr_stock for the specific plant
      const { error: updateError } = await supabase
        .from('pr_stock')
        .update({ bin_location: destination })
        .eq('roll_id', rollId)
        .eq('plant', plant); // Use plant in query

      if (updateError) {
        throw new Error(`Failed to update roll location: ${updateError.message}. Manual correction may be needed.`);
      }

      // 4. Refresh the production rolls list
      await fetchProductionRolls();

      setMessage(`Roll ${rollId} successfully moved to production at ${destination}.`);
      setRollId(''); // Clear input for next scan
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancel = async (roll) => {
    try {
      // Find the specific 'issue' movement (type '201') that moved the roll to its current location.
      const { data: issueMovement, error: movementError } = await supabase
        .from('pr_stock_movements')
        .select('id, initial_loc')
        .eq('roll_id', roll.roll_id)
        .eq('movement_type', '201') // Specifically find the 'issue' movement
        .eq('destination_loc', roll.bin_location) // That resulted in the current location
        .order('created_at', { ascending: false }) // Get the most recent one
        .limit(1)
        .single();

      if (movementError || !issueMovement) {
        throw new Error(`Could not find the specific 'issue' movement to cancel for roll ${roll.roll_id}. It may have already been cancelled or returned.`);
      }

      // Revert the bin_location in pr_stock to the initial location from the movement
      const { error: updateError } = await supabase
        .from('pr_stock')
        .update({ bin_location: issueMovement.initial_loc })
        .eq('roll_id', roll.roll_id);

      if (updateError) {
        throw new Error(`Failed to revert stock location: ${updateError.message}`);
      }

      // Delete the movement record from pr_stock_movements
      const { error: deleteError } = await supabase
        .from('pr_stock_movements')
        .delete()
        .eq('id', issueMovement.id);

      if (deleteError) {
        throw new Error(`Failed to delete the movement history record: ${deleteError.message}.`);
      }

      // Refresh the list of production rolls
      await fetchProductionRolls();
      setMessage(`Cancelled issue of roll ${roll.roll_id}.`);
    } catch (error) {
      setError(`Error cancelling issue: ${error.message}`);
    }
  };

  const handleReturn = (roll) => {
    // Navigate to the pr-return page with roll_id and bin_location as query parameters
    router.push(`/paper-roll/pr-return?roll_id=${roll.roll_id}&bin_location=${roll.bin_location}`);
  };

  const handleUsedUp = async (roll) => {
    try {
      // Delete the roll from pr_stock
      const { error } = await supabase
        .from('pr_stock')
        .delete()
        .eq('roll_id', roll.roll_id);

      if (error) {
        throw error;
      }

      // Refresh the list of production rolls
      await fetchProductionRolls();
      setMessage(`Roll ${roll.roll_id} marked as used up and removed from stock.`);
    } catch (error) {
      setError(`Error marking roll as used up: ${error.message}`);
    }
  };

  // The component now returns only its own content, without the <Layout> wrapper
  return (
    <div>
      <h1>Issue Paper Roll</h1>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleConsume}>
        <div className="form-group">
          <label htmlFor="machineNumber">Machine Number</label>
          <div className="input-group">
            <select
              id="machineNumber"
              className="form-control"
              value={machineNumber}
              onChange={(e) => setMachineNumber(e.target.value)}
              disabled={isMachineLocked}
            >
              <option>C1</option>
              <option>C2</option>
            </select>
            <div className="input-group-append">
              <button
                className={`btn ${isMachineLocked ? 'btn-success' : 'btn-outline-secondary'}`}
                type="button"
                onClick={() => setIsMachineLocked(!isMachineLocked)}
              >
                {isMachineLocked ? 'Unlock' : 'Lock'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="unitName">Unit Name</label>
          <select
            id="unitName"
            className="form-control"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
          >
            <option>CL</option>
            <option>CM</option>
            <option>BL</option>
            <option>BM</option>
            <option>DB</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="rollId">Scan Roll ID</label>
          <input
            type="text"
            id="rollId"
            className="form-control"
            value={rollId}
            onChange={(e) => setRollId(e.target.value)}
            placeholder="Scan roll barcode"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Consume Roll
        </button>
      </form>

      <h2 className="mt-5">Roll on Production</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Roll ID</th>
            <th>Kind</th>
            <th>GSM</th>
            <th>Width</th>
            <th>Weight</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {productionRolls.length > 0 ? (
            productionRolls.map((roll) => (
              <tr key={roll.roll_id}>
                <td>{roll.roll_id}</td>
                <td>{roll.kind}</td>
                <td>{roll.gsm}</td>
                <td>{roll.width}</td>
                <td>{roll.weight}</td>
                <td>{roll.bin_location}</td>
                <td>
                  <button className="btn btn-sm btn-warning mr-2" onClick={() => handleCancel(roll)}>Cancel</button>
                  <button className="btn btn-sm btn-info mr-2" onClick={() => handleReturn(roll)}>Return</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleUsedUp(roll)}>Used Up</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">No rolls found at this production location.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PRIssue;
