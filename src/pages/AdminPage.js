import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  createSession, subscribeToSessions, toggleCheckIn, 
  getAllUsers, registerForSession, deleteSession, 
  updateParticipantStatus, updateSessionData 
} from '../firebase/db';

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schedule');
  const [requestsView, setRequestsView] = useState('mentors');
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmPopup, setConfirmPopup] = useState({ show: false, title: '', message: '', onConfirm: null });

  // Users tab search
  const [userSearch, setUserSearch] = useState('');

  // Form State
  const [editMode, setEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formData, setFormData] = useState({
    mentorName: '', 
    room: '', 
    photoUrl: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToSessions((data) => {
      setSessions(data);
      setLoading(false);
    });

    const loadUsers = async () => {
      const userList = await getAllUsers();
      setUsers(userList);
    };
    loadUsers();

    return () => unsubscribe();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmPopup({ show: true, title, message, onConfirm });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleDeleteSlot = (sessionId) => {
    showConfirm(
      "Delete Slot",
      "Are you sure you want to delete this mentorship slot?",
      async () => {
        await deleteSession(sessionId);
        showToast("Slot deleted", "success");
      }
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) {
        showToast("Image too large (max 500KB)", "error");
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result });
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      expertise: 'General',
      datetime: new Date().toISOString(),
      maxParticipants: 10
    };

    try {
      if (editMode) {
        const sessionToEdit = sessions.find(s => s.id === currentEditId);
        const finalPayload = {
          ...sessionToEdit,
          mentorName: formData.mentorName,
          room: formData.room,
          photoUrl: formData.photoUrl
        };
        await updateSessionData(currentEditId, finalPayload);
        showToast("Session updated!", "success");
        setEditMode(false);
        setCurrentEditId(null);
      } else {
        await createSession(payload);
        showToast("New slot created!", "success");
        setActiveTab('requests');
      }
    } catch (err) {
      showToast("Operation failed: " + err.message, "error");
    }

    setFormData({ mentorName: '', room: '', photoUrl: '' });
    setLoading(false);
  };

  const prepareEdit = (session) => {
    setEditMode(true);
    setCurrentEditId(session.id);
    setFormData({
      mentorName: session.mentorName,
      room: session.room,
      photoUrl: session.photoUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStatusChange = (sessionId, userId, newStatus) => {
    const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    showConfirm(
      `${statusText} Confirmation`,
      `Change status to "${statusText}"?`,
      async () => {
        await updateParticipantStatus(sessionId, userId, newStatus);
        showToast(`Status updated to ${statusText}`, "success");
      }
    );
  };

  const handleCheckInToggle = (sessionId, userId, isCheckedIn) => {
    const action = isCheckedIn ? 'Check Out' : 'Check In';
    showConfirm(
      `${action} Confirmation`,
      `Are you sure?`,
      async () => {
        await toggleCheckIn(sessionId, userId);
        showToast(isCheckedIn ? "Checked out" : "Checked in", "success");
      }
    );
  };

  // Filter users
  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.teamName || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const admins = filteredUsers.filter(u => u.role === 'admin');
  const regularUsers = filteredUsers.filter(u => u.role !== 'admin');

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      background: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Toast */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '16px 24px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          {toast.message}
        </div>
      )}

      {/* Confirmation Popup */}
      {confirmPopup.show && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '420px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ margin: '0 0 16px' }}>{confirmPopup.title}</h3>
            <p style={{ margin: '0 0 24px' }}>{confirmPopup.message}</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmPopup({ show: false })}
                style={{ padding: '12px 28px', background: '#e5e7eb', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmPopup.onConfirm();
                  setConfirmPopup({ show: false });
                }}
                style={{ padding: '12px 28px', background: '#ef4444', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#1e293b' }}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '10px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <button onClick={() => setActiveTab('schedule')} style={{ padding: '12px 24px', background: activeTab === 'schedule' ? '#6366f1' : 'transparent', color: activeTab === 'schedule' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Manage Schedule
        </button>
        <button onClick={() => setActiveTab('requests')} style={{ padding: '12px 24px', background: activeTab === 'requests' ? '#6366f1' : 'transparent', color: activeTab === 'requests' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Requests & Approvals
        </button>
        <button onClick={() => setActiveTab('users')} style={{ padding: '12px 24px', background: activeTab === 'users' ? '#6366f1' : 'transparent', color: activeTab === 'users' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Users List
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>Loading...</div>}

      {/* TAB: Manage Schedule */}
      {!loading && activeTab === 'schedule' && (
        <div>
          {/* Form */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>{editMode ? 'Edit Session' : 'Create New Session'}</h2>
              {editMode && (
                <button onClick={() => { setEditMode(false); setCurrentEditId(null); setFormData({ mentorName: '', room: '', photoUrl: '' }); }} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ fontWeight: '600' }}>Mentor Name</label>
                <input type="text" value={formData.mentorName} onChange={e => setFormData({ ...formData, mentorName: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
              </div>

              <div>
                <label style={{ fontWeight: '600' }}>Room</label>
                <input type="text" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
              </div>

              <div>
                <label style={{ fontWeight: '600' }}>Mentor Photo (optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={formData.photoUrl || 'https://ui-avatars.com/api/?name=mentor&background=random'} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ padding: '12px' }} />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ padding: '14px', background: editMode ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Saving...' : (editMode ? 'Update Session' : 'Create Slot')}
              </button>
            </form>
          </div>

          {/* Existing Sessions */}
          <h3>Existing Sessions</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {sessions.map(session => (
              <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={session.photoUrl || `https://ui-avatars.com/api/?name=${session.mentorName}&background=random`} alt={session.mentorName} style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: '600' }}>{session.mentorName}</div>
                    <div style={{ color: '#64748b' }}>Room: {session.room}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => prepareEdit(session)} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDeleteSlot(session.id)} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Requests & Approvals */}
      {!loading && activeTab === 'requests' && (
        <div>
          <h2 style={{ marginBottom: '24px' }}>Requests & Approvals</h2>

          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setRequestsView('mentors')}
              style={{
                padding: '10px 20px',
                background: requestsView === 'mentors' ? '#6366f1' : '#f1f5f9',
                color: requestsView === 'mentors' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              By Mentors
            </button>
            <button
              onClick={() => setRequestsView('approved')}
              style={{
                padding: '10px 20px',
                background: requestsView === 'approved' ? '#6366f1' : '#f1f5f9',
                color: requestsView === 'approved' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Approved Students
            </button>
            <button
              onClick={() => setRequestsView('pending')}
              style={{
                padding: '10px 20px',
                background: requestsView === 'pending' ? '#6366f1' : '#f1f5f9',
                color: requestsView === 'pending' ? 'white' : '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Pending Requests
            </button>
          </div>

          {sessions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>No sessions yet.</p>
          ) : (
            <div>
              {requestsView === 'mentors' && (
                <div style={{ display: 'grid', gap: '24px' }}>
                  {sessions.map(session => (
                    <div key={session.id} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                      <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{session.mentorName} - Room {session.room}</strong>
                        <span>{session.participants?.length || 0} participants</span>
                      </div>
                      <div style={{ padding: '16px' }}>
                        {session.participants?.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#94a3b8' }}>No requests</p>
                        ) : (
                          session.participants.map((p, idx) => (
                            <ParticipantItem key={idx} p={p} sessionId={session.id} handleStatusChange={handleStatusChange} handleCheckInToggle={handleCheckInToggle} />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {requestsView === 'approved' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {sessions.flatMap(s => s.participants || [])
                    .filter(p => p.status === 'approved')
                    .map((p, idx) => (
                      <ParticipantItem key={idx} p={p} sessionId={sessions.find(s => s.participants?.includes(p))?.id} handleStatusChange={handleStatusChange} handleCheckInToggle={handleCheckInToggle} />
                    ))}
                  {sessions.flatMap(s => s.participants || []).filter(p => p.status === 'approved').length === 0 && (
                    <p style={{ textAlign: 'center', color: '#64748b' }}>No approved students yet</p>
                  )}
                </div>
              )}

              {requestsView === 'pending' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {sessions.flatMap(s => s.participants || [])
                    .filter(p => p.status === 'pending')
                    .map((p, idx) => (
                      <ParticipantItem key={idx} p={p} sessionId={sessions.find(s => s.participants?.includes(p))?.id} handleStatusChange={handleStatusChange} handleCheckInToggle={handleCheckInToggle} />
                    ))}
                  {sessions.flatMap(s => s.participants || []).filter(p => p.status === 'pending').length === 0 && (
                    <p style={{ textAlign: 'center', color: '#64748b' }}>No pending requests</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: Users List - No Name column */}
      {!loading && activeTab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ margin: 0 }}>Users & Admins</h2>
            <input
              type="text"
              placeholder="Search by email or team..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', width: '300px', maxWidth: '100%' }}
            />
          </div>

          {/* Admins Card */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#1e40af' }}>
              Admin: Deepak Chetri ({admins.length})
            </h3>
            {admins.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>No admins found</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#dbeafe' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Team Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>{u.teamName || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#dbeafe', color: '#1e40af', fontWeight: '600' }}>
                            ADMIN
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Regular Users Card */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#475569' }}>Users ({regularUsers.length})</h3>
            {regularUsers.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>No users found</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Team Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regularUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>{u.teamName || '—'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#f3f4f6', color: '#475569', fontWeight: '600' }}>
                            USER
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Participant Item Component (unchanged)
const ParticipantItem = ({ p, sessionId, handleStatusChange, handleCheckInToggle }) => {
  const status = p.status || 'pending';
  const isCheckedIn = p.checkedIn;

  return (
    <div style={{
      padding: '12px',
      background: status === 'approved' ? '#ecfdf5' : status === 'rejected' ? '#fee2e2' : status === 'completed' ? '#f3f4f6' : '#fffbeb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong>{p.name || p.email}</strong>
        <span style={{
          padding: '6px 14px',
          borderRadius: '999px',
          fontSize: '0.85rem',
          fontWeight: '600',
          background: status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : status === 'completed' ? '#6b7280' : '#d97706',
          color: 'white'
        }}>
          {status.toUpperCase()}
          {isCheckedIn && status === 'approved' && ' (Checked In)'}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={() => handleStatusChange(sessionId, p.uid, 'approved')} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Approve
        </button>
        <button onClick={() => handleStatusChange(sessionId, p.uid, 'rejected')} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Deny
        </button>

        {status === 'approved' && (
          <button onClick={() => handleCheckInToggle(sessionId, p.uid, isCheckedIn)} style={{ padding: '8px 16px', background: isCheckedIn ? '#3b82f6' : '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {isCheckedIn ? 'Undo Check-in' : 'Check In'}
          </button>
        )}

        <button onClick={() => handleStatusChange(sessionId, p.uid, status === 'completed' ? 'approved' : 'completed')} style={{ padding: '8px 16px', background: status === 'completed' ? '#3b82f6' : '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {status === 'completed' ? 'Undo Done' : 'Mark Done'}
        </button>
      </div>
    </div>
  );
};

export default AdminPage;