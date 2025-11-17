
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { passwordReset } = useAuth(); // Updated function name from useAuth

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const { error: resetError } = await passwordReset(email);
    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Check your email for a password reset link.');
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}
