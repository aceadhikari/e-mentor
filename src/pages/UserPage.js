import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { subscribeToSessions, requestSession } from '../firebase/db';

const UserPage = () => {
  const [activeTab, setActiveTab] = useState('register'); // 'register', 'live', 'routine'
  const [sessions, setSessions] = useState([]);
  
  const [filterMentor, setFilterMentor] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    const unsubscribe = subscribeToSessions((data) => {
      setSessions(data);
    });
    return unsubscribe;
  }, []);

  const handleRequest = async (sessionId) => {
    if (!currentUser) return alert("Please login first");
    
    const confirm = window.confirm("Send request to Admin for mentorship?");
    if (confirm) {
      const res = await requestSession(sessionId, currentUser);
      if (res.success) {
        alert("Request Sent! Waiting for Admin approval.");
      } else {
        alert("Error: " + res.error);
      }
    }
  };

  // --- Helper: Check if user already has a booking anywhere ---
  const hasActiveBooking = () => {
    if (!currentUser) return false;
    return sessions.some(s => 
      s.participants.some(p => 
        p.uid === currentUser.uid && (p.status === 'pending' || p.status === 'approved')
      )
    );
  };

  // Helper: Get user's status in a specific session
  const getUserStatus = (participants) => {
    if (!currentUser) return null;
    const me = participants.find(p => p.uid === currentUser.uid);
    return me ? me.status : null;
  };

  // --- TAB 1: REGISTER (One Booking Limit) ---
  const filteredSessions = sessions.filter(s => s.mentorName.toLowerCase().includes(filterMentor.toLowerCase()));

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>User Dashboard</h1>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #f1f5f9' }}>
        <button 
          style={{ padding: '10px 20px', background: activeTab==='register'?'#4F46E5':'transparent', color: activeTab==='register'?'white':'#64748b', border:'none', cursor:'pointer', borderRadius:'8px 8px 0 0', fontWeight:'bold' }}
          onClick={() => setActiveTab('register')}
        >1. Register for Mentorship</button>
        <button 
          style={{ padding: '10px 20px', background: activeTab==='live'?'#4F46E5':'transparent', color: activeTab==='live'?'white':'#64748b', border:'none', cursor:'pointer', borderRadius:'8px 8px 0 0', fontWeight:'bold' }}
          onClick={() => setActiveTab('live')}
        >2. Live Dashboard</button>
        <button 
          style={{ padding: '10px 20px', background: activeTab==='routine'?'#4F46E5':'transparent', color: activeTab==='routine'?'white':'#64748b', border:'none', cursor:'pointer', borderRadius:'8px 8px 0 0', fontWeight:'bold' }}
          onClick={() => setActiveTab('routine')}
        >3. Routine (Timetable)</button>
      </div>

      {/* --- TAB 1 --- */}
      {activeTab === 'register' && (
        <div>
          <input 
            placeholder="Filter by Mentor Name..." 
            value={filterMentor} 
            onChange={e => setFilterMentor(e.target.value)} 
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', marginBottom: '20px', width: '100%', maxWidth: '300px' }}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredSessions.map(session => {
              const myStatus = getUserStatus(session.participants);
              const isFull = session.participants.length >= session.maxParticipants;
              const activeBookingElsewhere = hasActiveBooking() && !myStatus;

              return (
                <div key={session.id} style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', position: 'relative' }}>
                  
                  {/* Mentor Profile Pic */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <img 
                      src={session.photoUrl || `https://ui-avatars.com/api/?name=${session.mentorName}&background=random`} 
                      alt={session.mentorName}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }}
                    />
                    <div>
                      <h3 style={{ margin: 0 }}>{session.mentorName}</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{session.expertise}</p>
                    </div>
                  </div>

                  <p>📅 {new Date(session.datetime).toLocaleString()}</p>
                  <p>🚪 Room: {session.room}</p>
                  <p>👥 Slots: {session.participants.length} / {session.maxParticipants}</p>
                  
                  {/* Status Logic */}
                  {!myStatus ? (
                    isFull ? (
                      <button disabled style={{ width:'100%', marginTop:'10px', padding:'10px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'5px', cursor:'not-allowed' }}>Spot Full</button>
                    ) : activeBookingElsewhere ? (
                      <div style={{ width:'100%', marginTop:'10px', padding:'10px', background:'#fff7ed', color:'#c2410c', border:'1px solid #fed7aa', borderRadius:'5px', textAlign:'center', fontSize:'0.9rem' }}>
                        <strong>Limit Reached:</strong> You can only register for one mentor at a time.
                      </div>
                    ) : (
                      <button onClick={() => handleRequest(session.id)} style={{ width:'100%', marginTop:'10px', padding:'10px', background:'#4F46E5', color:'white', border:'none', borderRadius:'5px', cursor:'pointer' }}>Request Spot</button>
                    )
                  ) : (
                    <div style={{ marginTop:'10px', padding:'10px', textAlign:'center', borderRadius:'5px', fontWeight:'bold', 
                      background: myStatus === 'pending' ? '#fff7ed' : (myStatus === 'approved' ? '#ecfdf5' : '#fee2e2'),
                      color: myStatus === 'pending' ? '#c2410c' : (myStatus === 'approved' ? '#047857' : '#b91c1c')
                    }}>
                      {myStatus === 'pending' && '⏳ In Process'}
                      {myStatus === 'approved' && '✅ Approved'}
                      {myStatus === 'rejected' && '❌ Rejected'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 2: LIVE DASHBOARD (Accepted Only) --- */}
      {activeTab === 'live' && (
        <div>
          <h2>Live Mentorship Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {sessions.map(session => {
              
              // FILTER: Only Approved Teams
              const approvedTeam = session.participants.filter(p => p.status === 'approved');
              const activeTeam = approvedTeam.find(p => p.checkedIn === true);
              const isMentoring = !!activeTeam; 

              return (
                <div key={session.id} style={{
                  padding: '20px', borderRadius: '12px', background: '#fff',
                  boxShadow: isMentoring ? '0 0 15px rgba(239, 68, 68, 0.6)' : '0 2px 5px rgba(0,0,0,0.1)',
                  border: isMentoring ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Mentor Pic */}
                      <img 
                        src={session.photoUrl || `https://ui-avatars.com/api/?name=${session.mentorName}&background=random`} 
                        alt={session.mentorName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                      />
                      <h3 style={{ margin: 0 }}>{session.mentorName}</h3>
                    </div>
                    <span style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', background: isMentoring ? '#fee2e2' : '#ecfdf5', color: isMentoring ? '#ef4444' : '#10b981' }}>
                      {isMentoring ? 'BUSY' : 'FREE'}
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>Approved Team Queue:</h4>
                    {approvedTeam.length === 0 ? <p style={{fontSize:'0.8rem', color:'#94a3b8'}}>No approved team yet.</p> : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {approvedTeam.map((p, idx) => {
                          const isCurrent = p.checkedIn;
                          return (
                            <li key={idx} style={{
                              padding: '8px', marginBottom: '5px', borderRadius: '6px',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: isCurrent ? '#2563eb' : 'transparent',
                              color: isCurrent ? 'white' : '#334155',
                              fontWeight: isCurrent ? 'bold' : 'normal'
                            }}>
                              <span>
                                <span style={{ opacity: 0.6, marginRight: '8px' }}>#{idx + 1}</span> 
                                Team: {p.name}
                              </span>
                              {isCurrent && <span style={{ fontSize: '0.75rem', background:'white', color:'#2563eb', padding:'2px 6px', borderRadius:'4px' }}>CURRENT</span>}
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

      {/* --- TAB 3: ROUTINE (Timetable - Highlight Approved Slot) --- */}
      {activeTab === 'routine' && (
        <div>
          <h2>Mentorship Routine</h2>
          <div style={{ overflowX: 'auto' }}>
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', background: 'white', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#4F46E5', color: 'white' }}>
                  <th style={{ padding: '10px' }}>Time / Mentor</th>
                  {Array.from(new Set(sessions.map(s => s.mentorName))).map(mentor => (
                    <th key={mentor} style={{ padding: '10px' }}>{mentor}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(sessions.map(s => new Date(s.datetime).toLocaleString([], {hour: '2-digit', minute:'2-digit'})))).map((timeSlot) => (
                  <tr key={timeSlot}>
                    <td style={{ padding: '10px', fontWeight: 'bold', background: '#f1f5f9' }}>{timeSlot}</td>
                    {Array.from(new Set(sessions.map(s => s.mentorName))).map(mentor => {
                      const session = sessions.find(s => 
                        new Date(s.datetime).toLocaleString([], {hour: '2-digit', minute:'2-digit'}) === timeSlot &&
                        s.mentorName === mentor
                      );
                      
                      if (session) {
                        // Check if User is Approved in this session
                        const userApproved = session.participants.find(p => p.uid === currentUser?.uid && p.status === 'approved');
                        
                        return (
                          <td key={mentor + timeSlot} style={{ 
                            padding: '10px', border: '1px solid #eee',
                            background: userApproved ? '#dbeafe' : 'transparent',
                            border: userApproved ? '2px solid #2563eb' : '1px solid #eee'
                          }}>
                            <div style={{ fontSize: '0.85rem' }}>
                              <div><strong>{session.room}</strong></div>
                              <div style={{ color: '#64748b' }}>{session.expertise}</div>
                              {userApproved && <div style={{ marginTop:'4px', color:'#2563eb', fontWeight:'bold' }}>★ MY SLOT</div>}
                            </div>
                          </td>
                        );
                      } else {
                        return <td key={mentor + timeSlot} style={{ padding: '10px', border: '1px solid #eee' }}><span style={{ color: '#cbd5e1' }}>-</span></td>;
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;