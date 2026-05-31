import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../services/firebase';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card glass">
        <div className="login-head">
          <img src="/favicon.svg" className="brand-mark" alt="" />
          <h1>{isRegistering ? 'Create account' : 'Welcome back'}</h1>
          <p>Sign in to plan optimized routes</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="email"
            className="field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="alert" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Processing…' : (isRegistering ? 'Register' : 'Sign in')}
          </button>
        </form>

        <p className="login-toggle">
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}