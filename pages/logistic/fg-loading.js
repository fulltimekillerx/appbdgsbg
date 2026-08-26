import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { addItemToTruck, deleteItemFromTruck, finalizeShipment } from '../../hooks/useShipment';

const FGLoading = ({ plant }) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [truckNo, setTruckNo] = useState('');
  const [soNumber, setSoNumber] = useState('');
  const [soItem, setSoItem] = useState('');
  const [lmgNumber, setLmgNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [printDesign, setPrintDesign] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loadingData, setLoadingData] = useState([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const router = useRouter();
  const { session } = useAuth() || {};
  const { truck_no: truckNoFromQuery, so_number: soNumberFromQuery, so_item: soItemFromQuery } = router.query;

  const fetchLoadingData = async () => {
    if (!truckNo || !plant) return;

    try {
      const { data, error } = await supabase
        .from('fg_loading')
        .select('*')
        .eq('plant', plant)
        .eq('truck_no', truckNo)
        .eq('status', 'Loading')
        .order('id', { ascending: false });

      if (error) throw error;
      setLoadingData(data);
    } catch (error) {
      setError(`Error fetching loading data: ${error.message}`);
    }
  };

  useEffect(() => {
    if (truckNoFromQuery) {
      setTruckNo(truckNoFromQuery);
    }
    if (soNumberFromQuery) {
      setSoNumber(soNumberFromQuery);
    }
    if (soItemFromQuery) {
      setSoItem(soItemFromQuery);
    }
  }, [truckNoFromQuery, soNumberFromQuery, soItemFromQuery]);

  useEffect(() => {
    if (truckNo && plant) {
      fetchLoadingData();
      const channel = supabase.channel(`fg_loading_changes_${truckNo}`);
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fg_loading', filter: `truck_no=eq.${truckNo}` }, () => {
          fetchLoadingData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [truckNo, plant]);

  useEffect(() => {
    const fetchStockData = async () => {
      if (lmgNumber) {
        const { data, error } = await supabase
          .from('fg_stock')
          .select('so_number, so_item, customer_name, print_design, weight, quantity')
          .eq('lmg_number', lmgNumber)
          .single();

        if (data) {
          setSoNumber(data.so_number || '');
          setSoItem(data.so_item || '');
          setCustomerName(data.customer_name || '');
          setPrintDesign(data.print_design || '');
          setWeight(data.weight || '');
          setQuantity(data.quantity || '');
        } else {
          setSoNumber('');
          setSoItem('');
          setCustomerName('');
          setPrintDesign('');
          setWeight('');
          setQuantity('');
        }
      } else {
          setSoNumber('');
          setSoItem('');
          setCustomerName('');
          setPrintDesign('');
          setWeight('');
          setQuantity('');
      }
    };
    fetchStockData();
  }, [lmgNumber]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!truckNo || !lmgNumber || !quantity) {
      setError('Truck No, LMG Number, and Quantity are required.');
      return;
    }

    if (!plant) {
      setError('Cannot determine plant. Please make sure you are logged in and have a plant assigned.');
      return;
    }

    try {
        const { data: stockData, error: stockError } = await supabase
            .from('fg_stock')
            .select('so_number, so_item, quantity')
            .eq('lmg_number', lmgNumber)
            .single();

        if (stockError || !stockData) {
            setError('LMG Number does not exist in stock.');
            return;
        }

        if (!stockData.so_number || !stockData.so_item) {
            setError('SO Number and SO Item are missing for this LMG number.');
            return;
        }

        if (parseInt(quantity, 10) > stockData.quantity) {
            setError(`Quantity cannot be greater than available stock quantity: ${stockData.quantity}`);
            return;
        }

        const result = await addItemToTruck({ truckNo, soNumber, soItem, lmgNumber, customerName, printDesign, quantity, plant });

        if (result.success) {
            setSuccess(result.message);
            setLmgNumber('');
            setQuantity('');
            fetchLoadingData();
        } else {
            setError(result.message);
        }
    } catch (error) {
        setError(`An unexpected error occurred: ${error.message}`);
    }
  };

  const handleDeleteItem = async (itemId, soNumber, soItem) => {
    setError('');
    setSuccess('');
    const result = await deleteItemFromTruck({ itemId, soNumber, soItem });
    if (result.success) {
      setSuccess(result.message);
      fetchLoadingData();
    } else {
      setError(result.message);
    }
  };

  const handleFinalizeShipment = async () => {
    setError('');
    setSuccess('');
    setIsFinalizing(true);
    const result = await finalizeShipment(session, plant, truckNo);
    if (result.success) {
      setSuccess(result.message);
      fetchLoadingData();
    } else {
      setError(result.message);
    }
    setIsFinalizing(false);
  };

  const handleBackToLoadingDock = () => {
    router.push('/logistic/fg-loadingdock');
  };

  const canFinalize = loadingData.length > 0 && loadingData.some(item => item.status === 'Loading');

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-secondary" onClick={handleBackToLoadingDock}>
          Back to Loading Dock
        </button>
        <button
          className="btn btn-success"
          onClick={handleFinalizeShipment}
          disabled={isFinalizing || !canFinalize}
        >
          {isFinalizing ? 'Finalizing...' : 'Finalize Shipment'}
        </button>
      </div>

      <h2>FG Loading</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
    <table>
      <td>
      <form onSubmit={handleAddItem} className="card mb-4">
        <div className="card-header"><h3>Add Item to Truck</h3></div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Truck No." value={truckNo} onChange={e => setTruckNo(e.target.value)} disabled />
            </div>
            <div className="col-md-4">
              <input type="text" className="form-control" placeholder="SO Number" value={soNumber} disabled />
            </div>
            <div className="col-md-4">
              <input type="text" className="form-control" placeholder="SO Item" value={soItem} disabled />
            </div>
            <div className="col-md-4">
              <input type="text" className="form-control" placeholder="Customer Name" value={customerName} disabled />
            </div>
            <div className="col-md-4">
              <input type="text" className="form-control" placeholder="Print Design" value={printDesign} disabled />
            </div>
            <div className="col-md-4">
              <input type="text" className="form-control" placeholder="Weight" value={weight} disabled />
            </div>
            <div className="col-md-4">
              <input type="text" className="form-control" placeholder="LMG Number" value={lmgNumber} onChange={e => setLmgNumber(e.target.value)} />
            </div>
            <div className="col-md-4">
              <input type="number" className="form-control" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary w-100">Add Item</button>
            </div>
          </div>
        </div>
      </form>
      </td>
      <td>
      <h3>Items on this Truck</h3>
      {loadingData.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>SO Number</th>
                  <th>SO Item</th>
                  <th>LMG Number</th>
                  <th>Customer Name</th>
                  <th>Print Design</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingData.map(item => (
                  <tr key={item.id}>
                    <td>{item.so_number}</td>
                    <td>{item.so_item}</td>
                    <td>{item.lmg_number}</td>
                    <td>{item.customer_name}</td>
                    <td>{item.print_design}</td>
                    <td>{item.quantity}</td>
                    <td>{item.status}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteItem(item.id, item.so_number, item.so_item)}
                        disabled={item.status !== 'Loading'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p>No items have been added to this truck yet.</p>
      )}
    </td>
    </table>
    </div>
  );
};

export default FGLoading;
