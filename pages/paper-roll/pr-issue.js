import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../hooks/useAuth';

const PRIssue = ({ plant }) => {
  const router = useRouter();
  const [machineNumber, setMachineNumber] = useState('C1');
  const [isMachineLocked, setIsMachineLocked] = useState(false);
  const [unitName, setUnitName] = useState('CL');
  const [rollId, setRollId] = useState('');
  const [productionRolls, setProductionRolls] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth() || {};

  const fetchProductionRolls = async () => {
    if (!plant) return;
    const destination = `${machineNumber} - ${unitName}`;
    const { data, error } = await supabase
      .from('pr_stock')
      .select('*')
      .eq('bin_location', destination)
      .eq('plant', plant);

    if (error) {
      setError(`Failed to fetch production rolls: ${error.message}`);
    } else {
      setProductionRolls(data);
    }
  };

  useEffect(() => {
    if (machineNumber && unitName && plant) {
      fetchProductionRolls();
    }
  }, [machineNumber, unitName, plant]);

  const handleConsume = async (e) => {
    e.preventDefault();
    if (!rollId || !user || !plant) {
      setError('Roll ID, user, and plant are required.');
      return;
    }

    setMessage('');
    setError('');

    try {
      const { data: stockData, error: fetchError } = await supabase
        .from('pr_stock')
        .select('*')
        .eq('roll_id', rollId)
        .eq('plant', plant)
        .single();

      if (fetchError || !stockData) {
        throw new Error(`Roll ID ${rollId} not found in plant ${plant}.`);
      }

      const destination = `${machineNumber} - ${unitName}`;

      const { error: movementError } = await supabase.from('pr_stock_movements').insert([
        {
          roll_id: stockData.roll_id,
          plant: plant,
          movement_type: '201', 
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

      const { error: updateError } = await supabase
        .from('pr_stock')
        .update({ bin_location: destination })
        .eq('roll_id', rollId)
        .eq('plant', plant);

      if (updateError) {
        throw new Error(`Failed to update roll location: ${updateError.message}. Manual correction may be needed.`);
      }

      await fetchProductionRolls();
      setMessage(`Roll ${rollId} successfully moved to production at ${destination}.`);
      setRollId('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancel = async (roll) => {
    try {
      // Backward-compatible: find the issue movement using new (destination_loc) or old (to_location) column names.
      const { data: issueMovement, error: movementError } = await supabase
        .from('pr_stock_movements')
        .select('id, initial_loc, from_location') // Select both new and old source location columns
        .eq('roll_id', roll.roll_id)
        .eq('movement_type', '201')
        .or(`destination_loc.eq.${roll.bin_location},to_location.eq.${roll.bin_location}`) // Check both destination columns
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (movementError || !issueMovement) {
        throw new Error(`Could not find the specific 'issue' movement to cancel for roll ${roll.roll_id}. It may have been cancelled already.`);
      }

      const originalLocation = issueMovement.initial_loc || issueMovement.from_location;
      if (!originalLocation) {
          throw new Error(`Original location for roll ${roll.roll_id} is missing from its movement history.`);
      }

      const { error: updateError } = await supabase
        .from('pr_stock')
        .update({ bin_location: originalLocation })
        .eq('roll_id', roll.roll_id);

      if (updateError) {
        throw new Error(`Failed to revert stock location: ${updateError.message}`);
      }

      const { error: deleteError } = await supabase
        .from('pr_stock_movements')
        .delete()
        .eq('id', issueMovement.id);

      if (deleteError) {
        throw new Error(`Failed to delete the movement history record: ${deleteError.message}.`);
      }

      await fetchProductionRolls();
      setMessage(`Cancelled issue of roll ${roll.roll_id}.`);
    } catch (error) {
      setError(`Error cancelling issue: ${error.message}`);
    }
  };

  const handleReturn = (roll) => {
    router.push(`/paper-roll/pr-return?roll_id=${roll.roll_id}&bin_location=${roll.bin_location}&plant=${plant}`);
  };

  const handleUsedUp = async (roll) => {
    try {
      const { error } = await supabase
        .from('pr_stock')
        .delete()
        .eq('roll_id', roll.roll_id);

      if (error) {
        throw error;
      }

      await fetchProductionRolls();
      setMessage(`Roll ${roll.roll_id} marked as used up and removed from stock.`);
    } catch (error) {
      setError(`Error marking roll as used up: ${error.message}`);
    }
  };

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
