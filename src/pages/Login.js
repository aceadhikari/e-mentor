import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Check console to see inputs
    console.log("Attempting login with:", email);

    const result = await loginUser(email, password);

    // 2. Check console to see what comes back from Firebase
    console.log("Firebase Result:", result);

    if (result.success) {
      console.log("Login Success! Role is:", result.role);
      console.log("Redirecting to:", result.role === 'admin' ? '/admin-page' : '/user-page');
      
      if (result.role === 'admin') {
        navigate('/admin-page');
      } else {
        navigate('/user-page');
      }
    } else {
      console.error("Login Failed:", result.error);
      setError(result.error);
    }
  };


  return (
    <div style={styles.container}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin} style={styles.form}>
        <input 
          type="email" placeholder="Email" value={email} 
          onChange={(e) => setEmail(e.target.value)} required style={styles.input}
        />
        <input 
          type="password" placeholder="Password" value={password} 
          onChange={(e) => setPassword(e.target.value)} required style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
      <p>No account? <a href="/register">Register</a></p>
    </div>
  );
};

const styles = {
  container: { padding: '50px', maxWidth: '400px', margin: 'auto', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', fontSize: '16px' },
  button: { padding: '12px', cursor: 'pointer', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '5px' }
};

export default Login;