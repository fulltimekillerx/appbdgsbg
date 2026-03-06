import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

const FGLoadingDock = ({ plant }) => {
  const { session } = useAuth() || {};
  const [loadingData, setLoadingData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchLoadingData = async () => {
    if (!plant) return;

    try {
      const { data, error } = await supabase
        .from('fg_loading')
        .select('*')
        .eq('plant', plant)
        .in('status', ['Waiting', 'Loading']);

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
    if (plant) {
      fetchLoadingData();
      const channel = supabase.channel('fg_loading_changes');
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fg_loading' }, () => {
          fetchLoadingData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [plant]);

  const handleFinalizeShipment = async (truckNoToFinalize) => {
    setError('');
    setSuccess('');

    try {
      const { data: itemsToMove, error: fetchError } = await supabase
        .from('fg_loading')
        .select('*')
        .eq('truck_no', truckNoToFinalize);

      if (fetchError) throw fetchError;

      const stockMovements = itemsToMove.map(item => {
        // Destructure to remove columns from fg_loading that are not in fg_stock_movements
        const { id, created_at, status, ...movementData } = item;

        return {
          ...movementData, // Contains the common fields: plant, so_number, so_item, quantity, truck_no
          movement_type: '601',
          user_id: session?.user?.id,
          lmg_number: `LMG-${item.truck_no}-${item.id}`, // Use item.id from fg_loading to ensure uniqueness
          initial_loc: item.plant,
          destination_loc: 'Customer'
        };
      });

      const { error: insertError } = await supabase
        .from('fg_stock_movements')
        .insert(stockMovements);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('fg_loading')
        .update({ status: 'Finish Loading' })
        .eq('truck_no', truckNoToFinalize);

      if (updateError) throw updateError;

      setSuccess(`Shipment for truck ${truckNoToFinalize} finalized.`);
      fetchLoadingData();
    } catch (error) {
      setError(`Error finalizing shipment: ${error.message}`);
    }
  };

  const handleCancelItemGroup = async (truckNo, item) => {
    setError('');
    setSuccess('');
    try {
        const { error } = await supabase
            .from('fg_loading')
            .delete()
            .eq('truck_no', truckNo)
            .eq('so_number', item.so_number)
            .eq('so_item', item.so_item);

        if (error) throw error;

        setSuccess(`Items for SO ${item.so_number} on truck ${truckNo} cancelled.`);
        fetchLoadingData();
    } catch (error) {
        setError(`Error cancelling items: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>FG Loading Dock</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="mb-3">
        <Link href="/logistic/fg-loading" passHref>
          <button className="btn btn-primary">Add New Truck</button>
        </Link>
      </div>

      <h3>Live Loading View</h3>
      {Object.keys(loadingData).length > 0 ? (
        <div className="card">
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>Truck No.</th>
                  <th>SO Number</th>
                  <th>SO Item</th>
                  <th>Total Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(loadingData).map(([truck, items]) => {
                  const aggregatedItems = items.reduce((acc, item) => {
                    const existing = acc.find(i => i.so_number === item.so_number && i.so_item === item.so_item);
                    if (existing) {
                      existing.quantity += item.quantity;
                    } else {
                      acc.push({ ...item });
                    }
                    return acc;
                  }, []);

                  return aggregatedItems.map((item, index) => (
                    <tr key={`${truck}-${item.so_number}-${item.so_item}`}>
                      {index === 0 && (
                        <td rowSpan={aggregatedItems.length}>{truck}</td>
                      )}
                      <td>{item.so_number}</td>
                      <td>{item.so_item}</td>
                      <td>{item.quantity}</td>
                      {index === 0 && (
                        <td rowSpan={aggregatedItems.length}>
                           <Link href={`/logistic/fg-loading?truck_no=${truck}`} passHref>
                            <button className="btn btn-info btn-sm">Add Item</button>
                          </Link>
                          <button className="btn btn-success btn-sm ms-1" onClick={() => handleFinalizeShipment(truck)}>Finalize Shipment</button>
                          <button className="btn btn-danger btn-sm ms-1" onClick={() => handleCancelItemGroup(truck, item)}>Cancel</button>
                        </td>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p>No trucks are currently being loaded.</p>
      )}
    </div>
  );
};

export default FGLoadingDock;
