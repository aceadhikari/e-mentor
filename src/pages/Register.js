import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../firebase/auth';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user', // Default to user
    adminCode: ''  // Only needed if role is admin
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Security check: If role is admin, they must provide the code
    const ADMIN_SECRET_CODE = "123"; // Change this to whatever you want
    if (formData.role === 'admin' && formData.adminCode !== ADMIN_SECRET_CODE) {
      setError("Invalid Admin Secret Code.");
      return;
    }

    const result = await registerUser(
      formData.email, 
      formData.password, 
      formData.role,
      formData.name
    );

    if (result.success) {
      // Redirect to login after success
      navigate('/login'); 
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input 
          name="name" type="text" placeholder="Full Name" onChange={handleChange} required 
          style={styles.input}
        />
        <input 
          name="email" type="email" placeholder="Email" onChange={handleChange} required 
          style={styles.input}
        />
        <input 
          name="password" type="password" placeholder="Password" onChange={handleChange} required 
          style={styles.input}
        />
        
        {/* Role Selection */}
        <div style={styles.radioGroup}>
          <label>
            <input 
              type="radio" name="role" value="user" 
              checked={formData.role === 'user'} onChange={handleChange} 
            /> User
          </label>
          <label>
            <input 
              type="radio" name="role" value="admin" 
              checked={formData.role === 'admin'} onChange={handleChange} 
            /> Admin
          </label>
        </div>

        {/* Show Code Field only if Admin is selected */}
        {formData.role === 'admin' && (
          <input 
            name="adminCode" type="password" placeholder="Enter Admin Secret Code" 
            onChange={handleChange} style={styles.input}
          />
        )}

        <button type="submit" style={styles.button}>Sign Up</button>
      </form>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
};

const styles = {
  container: { padding: '50px', maxWidth: '400px', margin: 'auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px', fontSize: '16px' },
  radioGroup: { display: 'flex', gap: '15px', margin: '5px 0' },
  button: { padding: '10px', cursor: 'pointer', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '5px' }
};

export default Register;