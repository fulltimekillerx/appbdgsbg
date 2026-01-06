import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../hooks/useAuth';

const FGIssue = ({ plant }) => {
  const router = useRouter();
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [lmgNumber, setLmgNumber] = useState('');
  const [issuedPallets, setIssuedPallets] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth() || {};

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!deliveryDate || !plant) return;
      const { data, error } = await supabase
        .from('fg_delivery_schedule')
        .select('*')
        .eq('delivery_date', deliveryDate)
        .eq('plant', plant);
      if (error) {
        setError(`Failed to fetch schedules: ${error.message}`);
      } else {
        setSchedules(data);
      }
    };
    fetchSchedules();
  }, [deliveryDate, plant]);

  useEffect(() => {
    const fetchIssuedPallets = async () => {
      if (!selectedSchedule) {
        setIssuedPallets([]);
        return;
      }
      const schedule = JSON.parse(selectedSchedule);
      const { data, error } = await supabase
        .from('fg_stock_movements')
        .select('lmg_number, destination_loc')
        .eq('sales_no', schedule.sales_no)
        .eq('sales_item', schedule.sales_item)
        .eq('movement_type', '201');

      if (error) {
        setError(`Failed to fetch issued pallets: ${error.message}`);
      } else {
        setIssuedPallets(data);
      }
    };
    fetchIssuedPallets();
  }, [selectedSchedule]);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!lmgNumber || !user || !plant || !selectedSchedule) {
      setError('LMG Number, user, plant, and a selected schedule are required.');
      return;
    }

    setMessage('');
    setError('');

    try {
      const schedule = JSON.parse(selectedSchedule);
      const { data: stockData, error: fetchError } = await supabase
        .from('fg_stock')
        .select('*')
        .eq('lmg_number', lmgNumber)
        .eq('plant', plant)
        .single();

      if (fetchError || !stockData) {
        throw new Error(`LMG Number ${lmgNumber} not found in plant ${plant}.`);
      }

      const destination = `TRUCK_LOADING - ${schedule.ship_to_party}`;

      const { error: movementError } = await supabase.from('fg_stock_movements').insert([
        {
          lmg_number: stockData.lmg_number,
          plant: plant,
          movement_type: '201',
          sales_no: schedule.sales_no,
          sales_item: schedule.sales_item,
          initial_loc: stockData.bin_location,
          destination_loc: destination,
          user_id: user.user_metadata.display_name || user.email,
        },
      ]);

      if (movementError) {
        throw new Error(`Failed to record movement: ${movementError.message}`);
      }

      const { error: updateError } = await supabase
        .from('fg_stock')
        .update({ bin_location: destination })
        .eq('lmg_number', lmgNumber)
        .eq('plant', plant);

      if (updateError) {
        throw new Error(`Failed to update pallet location: ${updateError.message}. Manual correction may be needed.`);
      }

      setLmgNumber('');
      await refetchIssuedPallets();
      setMessage(`Pallet ${lmgNumber} successfully issued for delivery to ${schedule.ship_to_party}.`);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCancel = async (lmg_number) => {
    try {
        const { data: movementToCancel, error: movementError } = await supabase
            .from('fg_stock_movements')
            .select('id, initial_loc')
            .eq('lmg_number', lmg_number)
            .eq('movement_type', '201')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (movementError || !movementToCancel) {
            throw new Error(`No issue movement found for pallet ${lmg_number} to cancel.`);
        }

        const { error: updateError } = await supabase
            .from('fg_stock')
            .update({ bin_location: movementToCancel.initial_loc })
            .eq('lmg_number', lmg_number);

        if (updateError) {
            throw new Error(`Failed to revert pallet location: ${updateError.message}`);
        }

        const { error: deleteError } = await supabase
            .from('fg_stock_movements')
            .delete()
            .eq('id', movementToCancel.id);

        if (deleteError) {
            // Revert the stock location if the movement deletion fails
            await supabase
                .from('fg_stock')
                .update({ bin_location: movementToCancel.destination_loc })
                .eq('lmg_number', lmg_number);
            throw new Error(`Failed to delete movement record: ${deleteError.message}`);
        }

        await refetchIssuedPallets();
        setMessage(`Issuance of pallet ${lmg_number} has been cancelled.`);
    } catch (error) {
        setError(`Error cancelling issue: ${error.message}`);
    }
  };

  const refetchIssuedPallets = async () => {
    if (!selectedSchedule) return;
    const schedule = JSON.parse(selectedSchedule);
    const { data, error } = await supabase
      .from('fg_stock_movements')
      .select('lmg_number, destination_loc')
      .eq('sales_no', schedule.sales_no)
      .eq('sales_item', schedule.sales_item)
      .eq('movement_type', '201');

    if (error) {
      setError(`Failed to fetch issued pallets: ${error.message}`);
    } else {
      setIssuedPallets(data);
    }
  }

  return (
    <div>
      <h1>Issue Finished Good for Delivery</h1>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="form-group">
        <label htmlFor="deliveryDate">Delivery Date</label>
        <input
          type="date"
          id="deliveryDate"
          className="form-control"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="scheduleSelect">Select Delivery Schedule</label>
        <select
          id="scheduleSelect"
          className="form-control"
          value={selectedSchedule}
          onChange={(e) => setSelectedSchedule(e.target.value)}
          disabled={!schedules.length}
        >
          <option value="">-- Select a Schedule --</option>
          {schedules.map(s => (
            <option key={s.id} value={JSON.stringify(s)}>
              {s.sales_no}/{s.sales_item} - {s.ship_to_party} ({s.qty} {s.uom})
            </option>
          ))}
        </select>
      </div>

      {selectedSchedule && (
        <form onSubmit={handleIssue}>
          <div className="form-group">
            <label htmlFor="lmgNumber">Scan LMG Number</label>
            <input
              type="text"
              id="lmgNumber"
              className="form-control"
              value={lmgNumber}
              onChange={(e) => setLmgNumber(e.target.value)}
              placeholder="Scan LMG barcode to issue"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Issue Pallet
          </button>
        </form>
      )}

      <h2 className="mt-5">Issued Pallets for this Schedule</h2>
      <table className="table">
        <thead>
          <tr>
            <th>LMG Number</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issuedPallets.length > 0 ? (
            issuedPallets.map((pallet, index) => (
              <tr key={index}>
                <td>{pallet.lmg_number}</td>
                <td>{pallet.destination_loc}</td>
                <td>
                  <button className="btn btn-sm btn-warning" onClick={() => handleCancel(pallet.lmg_number)}>Cancel</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center">No pallets issued for this schedule yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FGIssue;
