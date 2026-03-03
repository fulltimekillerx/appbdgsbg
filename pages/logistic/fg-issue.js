import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';

const FGMANLISSUE = ({ session }) => {
  const [truckNo, setTruckNo] = useState('');
  const [soNumber, setSoNumber] = useState('');
  const [soItem, setSoItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loadingData, setLoadingData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const plant = session?.user?.user_metadata?.plant;

  const fetchLoadingData = async () => {
    if (!plant) return;

    try {
      const { data, error } = await supabase
        .from('fg_loading')
        .select('*')
        .eq('plant', plant);

      if (error) throw error;

      const groupedByTruck = data.reduce((acc, item) => {
        if (!acc[item.truck_no]) {
          acc[item.truck_no] = [];
        }
        acc[item.truck_no].push(item);
        return acc;
      }, {});

      setLoadingData(groupedByTruck);
    } catch (error) {
      setError(`Error fetching loading data: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchLoadingData();
    const subscription = supabase
      .from('fg_loading')
      .on('*', () => fetchLoadingData())
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [plant]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!truckNo || !soNumber || !soItem || !quantity) {
      setError('All fields are required.');
      return;
    }

    try {
      const { error } = await supabase.from('fg_loading').insert([
        {
          truck_no: truckNo,
          so_number: soNumber,
          so_item: soItem,
          quantity: parseInt(quantity, 10),
          plant,
        },
      ]);

      if (error) throw error;

      setSuccess('Item added to truck successfully.');
      setSoNumber('');
      setSoItem('');
      setQuantity('');
    } catch (error) {
      setError(`Error adding item: ${error.message}`);
    }
  };

  const handleFinalizeShipment = async (truckNoToFinalize) => {
    setError('');
    setSuccess('');

    try {
      const { data: itemsToMove, error: fetchError } = await supabase
        .from('fg_loading')
        .select('*')
        .eq('truck_no', truckNoToFinalize);

      if (fetchError) throw fetchError;

      const stockMovements = itemsToMove.map(item => ({
        ...item,
        movement_type: '601',
        id: undefined, // Let the new table generate its own ID
        created_at: undefined, // Let the new table set the timestamp
      }));

      const { error: insertError } = await supabase
        .from('fg_stock_movements')
        .insert(stockMovements);

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from('fg_loading')
        .delete()
        .eq('truck_no', truckNoToFinalize);

      if (deleteError) throw deleteError;

      setSuccess(`Shipment for truck ${truckNoToFinalize} finalized.`);
    } catch (error) {
      setError(`Error finalizing shipment: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <h2>FG Manual Issue - Loading Dock</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleAddItem} className="card mb-4">
        <div className="card-header">Add Item to Truck</div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <input type="text" className="form-control" placeholder="Truck No." value={truckNo} onChange={e => setTruckNo(e.target.value)} />
            </div>
            <div className="col-md-3">
              <input type="text" className="form-control" placeholder="SO Number" value={soNumber} onChange={e => setSoNumber(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="text" className="form-control" placeholder="SO Item" value={soItem} onChange={e => setSoItem(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="number" className="form-control" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">Add Item</button>
            </div>
          </div>
        </div>
      </form>

      <h3>Live Loading View</h3>
      {Object.keys(loadingData).length > 0 ? (
        Object.entries(loadingData).map(([truck, items]) => (
          <div key={truck} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4>Truck: {truck}</h4>
              <button className="btn btn-success" onClick={() => handleFinalizeShipment(truck)}>Finalize & Issue Shipment</button>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>SO Number</th>
                    <th>SO Item</th>
                    <th>Total Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {items.reduce((acc, item) => {
                      const existing = acc.find(i => i.so_number === item.so_number && i.so_item === item.so_item);
                      if (existing) {
                        existing.quantity += item.quantity;
                      } else {
                        acc.push({ ...item });
                      }
                      return acc;
                    }, []).map(item => (
                    <tr key={`${item.so_number}-${item.so_item}`}>
                      <td>{item.so_number}</td>
                      <td>{item.so_item}</td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <p>No trucks are currently being loaded.</p>
      )}
    </div>
  );
};

export default FGMANLISSUE;
