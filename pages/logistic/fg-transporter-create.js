import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { useRouter } from 'next/router';

const FGTransporterCreate = () => {
  const [truckNo, setTruckNo] = useState('');
  const [truckType, setTruckType] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverNumber, setDriverNumber] = useState('');
  const [expedition, setExpedition] = useState('');
  const [dimensionLength, setDimensionLength] = useState('');
  const [dimensionWidth, setDimensionWidth] = useState('');
  const [dimensionHeight, setDimensionHeight] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);

    if (!truckNo) {
      setError('Truck number cannot be empty.');
      return;
    }

    const { error: insertError } = await supabase.from('fg_transporter').insert([
      {
        truck_no: truckNo,
        truck_type: truckType,
        driver_name: driverName,
        driver_number: driverNumber,
        expedition: expedition,
        dimension_length: dimensionLength,
        dimension_width: dimensionWidth,
        dimension_height: dimensionHeight,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage(`Truck number '${truckNo}' added successfully.`);
      setTruckNo('');
      setTruckType('');
      setDriverName('');
      setDriverNumber('');
      setExpedition('');
      setDimensionLength('');
      setDimensionWidth('');
      setDimensionHeight('');
      router.push('/logistic/fg-transporter-list');
    }
  };

  return (
    <div>
      <h2>Add New Transporter</h2>

      <div className="card mb-4">
        <div className="card-header">Transporter Details</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Truck Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter new truck number"
                  value={truckNo}
                  onChange={(e) => setTruckNo(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Truck Type</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter truck type"
                  value={truckType}
                  onChange={(e) => setTruckType(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Driver Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Driver Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter driver number"
                  value={driverNumber}
                  onChange={(e) => setDriverNumber(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Expedition</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter expedition"
                  value={expedition}
                  onChange={(e) => setExpedition(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Dimension (LxWxH)</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Length"
                    value={dimensionLength}
                    onChange={(e) => setDimensionLength(e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Width"
                    value={dimensionWidth}
                    onChange={(e) => setDimensionWidth(e.target.value)}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Height"
                    value={dimensionHeight}
                    onChange={(e) => setDimensionHeight(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-primary">Add Truck</button>
            </div>
          </form>
          {message && <div className="alert alert-success mt-3">{message}</div>}
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default FGTransporterCreate;
