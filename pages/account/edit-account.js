import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const EditAccount = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleCurrentPasswordChange = (e) => {
    setCurrentPassword(e.target.value);
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    // Handle name update logic here
    console.log('New name:', name);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Handle password change logic here
    console.log('Current password:', currentPassword);
    console.log('New password:', newPassword);
  };

  return (
    <div>
      <h2>Edit Account</h2>
      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          max-width: 500px;
          margin: 0 auto;
        }
        .form-group {
          display: grid;
          grid-template-columns: 150px 1fr;
          align-items: center;
          gap: 1rem;
        }
        label {
          text-align: right;
        }
        input {
          width: 100%;
          padding: 0.5rem;
          box-sizing: border-box;
        }
        button {
          grid-column: 1 / -1;
          justify-self: center;
          padding: 0.5rem 1rem;
          width: auto;
        }
        hr {
          border: 0;
          border-top: 1px solid #ccc;
          margin: 2rem 0;
        }
      `}</style>

      <form onSubmit={handleNameSubmit} className="form-grid">
        <h3>Edit Name</h3>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
          />
        </div>
        <button type="submit">Save Name</button>
      </form>

      <hr />

      <form onSubmit={handlePasswordSubmit} className="form-grid">
        <h3>Change Password</h3>
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={handleCurrentPasswordChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={handleNewPasswordChange}
          />
        </div>
        <button type="submit">Save Password</button>
      </form>
    </div>
  );
};

export default EditAccount;
