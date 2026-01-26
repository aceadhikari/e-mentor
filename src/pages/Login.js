import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value.trim());
    if (name === 'password') setPassword(value.trim());
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    console.log("Login attempt:", { email: trimmedEmail });

    const result = await loginUser(trimmedEmail, trimmedPassword);

    console.log("Login result:", result);

    if (result.success) {
      // Clean the role string (remove whitespace/newlines + case-insensitive)
      const cleanedRole = (result.role || '').trim().toLowerCase();
      
      console.log("Cleaned Role:", cleanedRole);

      setSuccess('Login successful! Redirecting...');
      
      // Use cleaned role for comparison
      const redirectPath = cleanedRole === 'admin' ? '/admin-page' : '/user-page';
      console.log("Redirecting to:", redirectPath);

      setTimeout(() => {
        navigate(redirectPath);
      }, 1500);
    } else {
      console.error("Login failed:", result.error);
      
      if (result.error?.includes('too-many-requests')) {
        setError('Too many attempts. Please wait 15–30 minutes and try again.');
      } else if (result.error?.includes('invalid-credential') || result.error?.includes('wrong-password')) {
        setError('Incorrect email or password.');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    }

    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        padding: '48px 40px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(8px)'
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#1e293b',
          marginBottom: '8px',
          fontSize: '2rem',
          fontWeight: '800'
        }}>
          Sign In
        </h2>

        <p style={{
          textAlign: 'center',
          color: '#64748b',
          marginBottom: '32px',
          fontSize: '1.05rem'
        }}>
          Welcome back — log in to continue
        </p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '0.95rem',
            textAlign: 'center',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#ecfdf5',
            color: '#065f46',
            padding: '14px',
            borderRadius: '10px',
            marginBottom: '24px',
            fontSize: '0.95rem',
            textAlign: 'center',
            border: '1px solid #a7f3d0'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleChange}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={handleChange}
              required
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              background: loading ? '#9ca3af' : 'linear-gradient(90deg, #6366f1, #4f46e5)',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '16px',
              fontSize: '1.1rem',
              fontWeight: '700',
              marginTop: '12px'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          color: '#64748b',
          fontSize: '0.95rem'
        }}>
          Don't have an account?{' '}
          <a href="/register" style={{
            color: '#6366f1',
            fontWeight: '700',
            textDecoration: 'none'
          }}>
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.95rem'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    background: 'white',
    '&:focus': {
      borderColor: '#6366f1',
      boxShadow: '0 0 0 3px rgba(99,102,241,0.15)'
    }
  },
  button: {
    width: '100%',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    transition: 'all 0.2s',
    boxShadow: '0 6px 16px rgba(99,102,241,0.25)'
  }
};

export default Login;