import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';

// --- CHANGED THESE NAMES TO MATCH YOUR EXISTING FILES ---
import AdminPage from './pages/AdminPage';       // Must match the file name
import UserPage from './pages/UserPage';         // Must match the file name

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* --- CHANGED THESE COMPONENTS TOO --- */}
          <Route path="/admin-page" element={<AdminPage />} />
          <Route path="/user-page" element={<UserPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;