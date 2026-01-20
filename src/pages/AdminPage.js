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
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [editMode, setEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [formData, setFormData] = useState({
    mentorName: '', expertise: '', room: '', 
    photoUrl: '', datetime: '', maxParticipants: 5
  });

  useEffect(() => {
    const unsubscribeSessions = subscribeToSessions((data) => {
      setSessions(data);
    });
    loadUsers();
    return () => unsubscribeSessions();
  }, []);

  const loadUsers = async () => {
    const userList = await getAllUsers();
    setUsers(userList);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleDeleteSlot = async (sessionId) => {
    const confirm = window.confirm("Delete this slot?");
    if (confirm) await deleteSession(sessionId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalPhotoUrl = formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.mentorName}&background=random`;

    if (editMode) {
      await updateSessionData(currentEditId, { ...formData, photoUrl: finalPhotoUrl });
      alert("Session Updated!");
      setEditMode(false);
      setCurrentEditId(null);
    } else {
      await createSession({ ...formData, photoUrl: finalPhotoUrl });
      alert("Session Created!");
      setActiveTab('requests');
    }
    setFormData({ mentorName: '', expertise: '', room: '', photoUrl: '', datetime: '', maxParticipants: 5 });
  };

  const prepareEdit = (session) => {
    setEditMode(true);
    setCurrentEditId(session.id);
    setFormData({
      mentorName: session.mentorName,
      expertise: session.expertise,
      room: session.room,
      photoUrl: session.photoUrl,
      datetime: session.datetime, 
      maxParticipants: session.maxParticipants
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAssignUser = async (sessionId, userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    await registerForSession(sessionId, { uid: user.id, name: user.name || user.email, email: user.email });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '8px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button style={{ padding: '10px 20px', background: activeTab==='schedule'?'#4F46E5':'#eee', border:'none', cursor:'pointer', borderRadius:'5px' }} onClick={() => setActiveTab('schedule')}>1. Manage Schedule</button>
        <button style={{ padding: '10px 20px', background: activeTab==='requests'?'#4F46E5':'#eee', border:'none', cursor:'pointer', borderRadius:'5px' }} onClick={() => setActiveTab('requests')}>2. Requests & Status</button>
        <button style={{ padding: '10px 20px', background: activeTab==='users'?'#4F46E5':'#eee', border:'none', cursor:'pointer', borderRadius:'5px' }} onClick={() => setActiveTab('users')}>3. Users List</button>
      </div>

      {/* --- TAB 1: MANAGE SCHEDULE --- */}
      {activeTab === 'schedule' && (
        <div>
          <div style={{ maxWidth: '600px', margin: 'auto', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <h2 style={{ display:'flex', justifyContent:'space-between' }}>
              {editMode ? 'Edit Session' : 'Create New Session'}
              {editMode && <button onClick={() => setEditMode(false)} style={{ fontSize:'0.8rem', padding:'5px 10px' }}>Cancel Edit</button>}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
              <input type="text" placeholder="Mentor Name" value={formData.mentorName} onChange={e => setFormData({...formData, mentorName: e.target.value})} required style={{ padding:'10px' }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <input type="text" placeholder="Expertise" value={formData.expertise} onChange={e => setFormData({...formData, expertise: e.target.value})} required style={{ padding:'10px' }} />
                <input type="text" placeholder="Room" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} required style={{ padding:'10px' }} />
              </div>
              <input type="url" placeholder="Photo URL (Optional)" value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} style={{ padding:'10px' }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <input type="datetime-local" value={formData.datetime} onChange={e => setFormData({...formData, datetime: e.target.value})} required style={{ padding:'10px' }} />
                <input type="number" placeholder="Max Participants" value={formData.maxParticipants} onChange={e => setFormData({...formData, maxParticipants: parseInt(e.target.value)})} required style={{ padding:'10px' }} />
              </div>
              <button type="submit" style={{ padding: '12px', background: editMode ? '#f59e0b' : '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                {editMode ? 'Update Session' : 'Create Slot'}
              </button>
            </form>
          </div>

          <h3>Existing Sessions</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {sessions.map(session => (
              <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div>
                  <strong>{session.mentorName}</strong> ({new Date(session.datetime).toLocaleDateString()})
                  <br />
                  <small>{session.room} | {session.expertise}</small>
                </div>
                <div>
                  <button onClick={() => prepareEdit(session)} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', marginRight: '5px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDeleteSlot(session.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 2: REQUESTS & APPROVALS --- */}
      {activeTab === 'requests' && (
        <div>
          <h2>Registration Requests & Live Status</h2>
          {sessions.length === 0 && <p>No sessions yet.</p>}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
            {sessions.map(session => {
              const isFull = session.participants.length >= session.maxParticipants;
              return (
                <div key={session.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                  <div style={{ padding: '15px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{session.mentorName}</strong>
                    <span style={{ fontSize: '0.8rem' }}>{session.room}</span>
                  </div>
                  
                  <div style={{ padding: '15px', maxHeight: '300px', overflowY: 'auto' }}>
                    {session.participants.length === 0 ? <p style={{fontSize:'0.8rem', color:'#94a3b8', textAlign:'center'}}>No participants.</p> : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {session.participants.map((p, idx) => {
                          // Defensive check: Default status to 'pending' if undefined
                          const currentStatus = p.status || 'pending'; 
                          const isPending = currentStatus === 'pending';
                          const isApproved = currentStatus === 'approved';

                          return (
                            <li key={idx} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <strong>{p.name}</strong>
                                <span style={{ color: isApproved ? 'green' : (currentStatus === 'rejected' ? 'red' : 'orange') }}>
                                  {currentStatus.toUpperCase()}
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '5px' }}>
                                {isPending && (
                                  <>
                                    <button onClick={() => updateParticipantStatus(session.id, p.uid, 'approved')} style={{ flex: 1, padding: '5px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Accept</button>
                                    <button onClick={() => updateParticipantStatus(session.id, p.uid, 'rejected')} style={{ flex: 1, padding: '5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Deny</button>
                                  </>
                                )}
                                
                                {isApproved && (
                                  <button 
                                    onClick={() => toggleCheckIn(session.id, p.uid)}
                                    style={{ width: '100%', padding: '5px', background: p.checkedIn ? '#2563eb' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    {p.checkedIn ? 'Active (Checked In)' : 'Check In'}
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: USERS LIST --- */}
      {activeTab === 'users' && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h2>Basic User Details</h2>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead style={{ background: '#f1f1f1' }}>
              <tr>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                // Defensive check: Default role to 'user' if undefined
                const role = u.role || 'user'; 
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{u.name || 'Unknown'}</td>
                    <td style={{ padding: '10px' }}>{u.email}</td>
                    <td style={{ padding: '10px' }}>{role.toUpperCase()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;