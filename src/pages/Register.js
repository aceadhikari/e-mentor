import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../firebase/auth';

const Register = () => {
  const ADMIN_EMAIL = "deepakchetriadmin@ecell.in";
  const ADMIN_PASSWORD = "deepakchetri02112003";

  const [formData, setFormData] = useState({
    teamName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.teamName) {
      setError('Team name is required');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    let finalRole = 'user';
    let finalPassword = formData.password.trim();

    // Silent admin override (no UI hint)
    if (formData.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      finalRole = 'admin';
      finalPassword = ADMIN_PASSWORD;
    }

    const result = await registerUser(
      formData.email.trim(),
      finalPassword,
      finalRole,
      undefined,
      formData.teamName.trim()
    );

    if (result.success) {
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error || 'Registration failed. Try again.');
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
          Create Your Account
        </h2>

        <p style={{
          textAlign: 'center',
          color: '#64748b',
          marginBottom: '32px',
          fontSize: '1.05rem'
        }}>
          Join the mentorship community today
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={styles.label}>Team Name</label>
            <input
              name="teamName"
              type="text"
              placeholder="Your team name"
              value={formData.teamName}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              style={styles.input}
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
                Creating...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          color: '#64748b',
          fontSize: '0.95rem'
        }}>
          Already have an account?{' '}
          <a href="/login" style={{
            color: '#6366f1',
            fontWeight: '700',
            textDecoration: 'none'
          }}>
            Sign In
          </a>
        </div>

        <p style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.85rem',
          marginTop: '24px'
        }}>
          MADE BY DEEPAK CHETRI
        </p>
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

export default Register;