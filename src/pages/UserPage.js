import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { subscribeToSessions, requestSession } from '../firebase/db';
import { doc, getDoc } from 'firebase/firestore';

const UserPage = () => {
  const [activeTab, setActiveTab] = useState('register');
  const [sessions, setSessions] = useState([]);
  const [filterMentor, setFilterMentor] = useState('');
  const [teamName, setTeamName] = useState('User');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const currentUser = auth.currentUser;

  // Fetch team name + show welcome popup once
  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setTeamName(data.teamName || data.name || 'User');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      };
      fetchUserData();

      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
        localStorage.setItem('hasSeenWelcome', 'true');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = subscribeToSessions((data) => {
      setSessions(data || []);
    });
    return () => unsubscribe();
  }, []);

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────

  const hasActiveBooking = () => {
    if (!currentUser) return false;
    return sessions.some((s) =>
      s.participants?.some(
        (p) => p.uid === currentUser.uid && (p.status === 'pending' || p.status === 'approved')
      )
    );
  };

  const getUserStatus = (participants = []) => {
    if (!currentUser) return null;
    const me = participants.find((p) => p.uid === currentUser.uid);
    return me ? me.status : null;
  };

  const filteredSessions = sessions.filter((s) =>
    s.mentorName?.toLowerCase().includes(filterMentor.toLowerCase())
  );

  const openRequestPopup = (sessionId) => {
    if (!currentUser) return alert('Please login first');
    setPendingSessionId(sessionId);
    setShowRequestPopup(true);
  };

  const confirmRequest = async () => {
    if (!pendingSessionId) return;
    setShowRequestPopup(false);

    try {
      const res = await requestSession(pendingSessionId, currentUser);
      if (res.success) {
        setShowSuccessPopup(true);
      } else {
        alert('Error: ' + (res.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Request failed: ' + err.message);
    }

    setPendingSessionId(null);
  };

  const allMentors = [...new Set(sessions.map((s) => s.mentorName))].sort();

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────

  return (
    <div
      style={{
        padding: '32px 24px',
        maxWidth: '1400px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* Welcome Popup (first visit only) */}
      {showWelcome && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowWelcome(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '40px',
              borderRadius: '20px',
              maxWidth: '500px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#1e293b', marginBottom: '16px', fontSize: '2rem' }}>
              Welcome, {teamName}!
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '1.1rem' }}>
              Let's get started with your mentorship journey
            </p>
            <button
              onClick={() => setShowWelcome(false)}
              style={{
                padding: '12px 32px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Let's Start
            </button>
          </div>
        </div>
      )}

      {/* Request Confirmation Popup */}
      {showRequestPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowRequestPopup(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '40px',
              borderRadius: '20px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#1e293b', marginBottom: '16px', fontSize: '1.8rem' }}>
              Confirm Request
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '1.1rem' }}>
              Send request to Admin for mentorship?
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowRequestPopup(false)}
                style={{
                  padding: '12px 32px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRequest}
                style={{
                  padding: '12px 32px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.05rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Yes, Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup after request sent */}
      {showSuccessPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSuccessPopup(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '40px',
              borderRadius: '20px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#065f46', marginBottom: '16px', fontSize: '1.8rem' }}>
              Request Sent!
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '1.1rem' }}>
              Waiting for Admin approval.
            </p>
            <button
              onClick={() => setShowSuccessPopup(false)}
              style={{
                padding: '12px 32px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '24px',
          letterSpacing: '-0.025em',
          textAlign: 'center',
        }}
      >
        Welcome, {teamName}
      </h1>

      {/* TABS */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '48px',
          background: 'white',
          padding: '12px',
          borderRadius: '16px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          width: 'fit-content',
          margin: '0 auto 48px',
        }}
      >
        {[
          { id: 'register', label: 'Register', icon: '📝' },
          { id: 'live', label: 'Live', icon: '🔴' },
          { id: 'routine', label: 'Schedule', icon: '🗓' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '14px 32px',
              fontSize: '1.1rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#6366f1' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#475569',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? '0 4px 14px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* REGISTER TAB */}
      {activeTab === 'register' && (
        <div>
          <input
            placeholder="Search mentor name..."
            value={filterMentor}
            onChange={(e) => setFilterMentor(e.target.value)}
            style={{
              padding: '16px 20px',
              fontSize: '1.1rem',
              borderRadius: '12px',
              border: '1px solid #d1d5db',
              width: '100%',
              maxWidth: '480px',
              marginBottom: '40px',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
              transition: 'border-color 0.2s',
              display: 'block',
              margin: '0 auto 40px',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '32px',
            }}
          >
            {filteredSessions.map((session) => {
              const myStatus = getUserStatus(session.participants);
              const isFull = (session.participants?.length || 0) >= (session.maxParticipants || 999);
              const hasBlocking = hasActiveBooking() && myStatus !== 'rejected';

              return (
                <div
                  key={session.id}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '32px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.25s ease',
                    transform: 'translateY(0)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 24px 48px rgba(99,102,241,0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <img
                      src={session.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.mentorName)}&background=6366f1&color=fff`}
                      alt={session.mentorName}
                      style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '5px solid #f3f4f6',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                      }}
                    />
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>
                    {session.mentorName}
                  </h3>

                  <div style={{ color: '#6b7280', fontSize: '1.05rem', fontWeight: 500, marginBottom: '24px' }}>
                    Room {session.room}
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    {!myStatus ? (
                      isFull ? (
                        <div
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '16px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            textAlign: 'center',
                            fontSize: '1.05rem',
                          }}
                        >
                          Fully Booked
                        </div>
                      ) : hasBlocking ? (
                        <div
                          style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '16px',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            lineHeight: 1.5,
                            textAlign: 'center',
                          }}
                        >
                          You have an active request/approval already
                          <br />
                          <small style={{ opacity: 0.85 }}>Please wait or cancel the existing one</small>
                        </div>
                      ) : (
                        <button
                          onClick={() => openRequestPopup(session.id)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.03)')}
                          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                        >
                          Request Slot
                        </button>
                      )
                    ) : myStatus === 'rejected' ? (
                      <div>
                        <div
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '14px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            textAlign: 'center',
                            marginBottom: '16px',
                          }}
                        >
                          Request Rejected
                        </div>
                        {hasBlocking ? (
                          <div style={{ color: '#6b7280', textAlign: 'center', fontSize: '1rem' }}>
                            Cannot request again — finish current booking first
                          </div>
                        ) : (
                          <button
                            onClick={() => openRequestPopup(session.id)}
                            style={{
                              width: '100%',
                              padding: '16px',
                              background: '#6366f1',
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Request Again
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '12px',
                          fontWeight: 600,
                          textAlign: 'center',
                          fontSize: '1.1rem',
                          background: myStatus === 'pending' ? '#fef3c7' : '#dcfce7',
                          color: myStatus === 'pending' ? '#92400e' : '#166534',
                        }}
                      >
                        {myStatus === 'pending' ? '⏳ Pending Approval' : '✅ Approved'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIVE TAB */}
      {activeTab === 'live' && (
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '40px' }}>
            Live Mentorship Status
          </h2>

          {sessions.length === 0 ? (
            <div
              style={{
                padding: '80px 32px',
                background: 'white',
                borderRadius: '20px',
                textAlign: 'center',
                boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
                color: '#6b7280',
              }}
            >
              <p style={{ fontSize: '1.4rem', marginBottom: '16px' }}>No active sessions right now</p>
              <small style={{ fontSize: '1.1rem' }}>Check back later or look at your registrations</small>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '32px' }}>
              {sessions.map((session) => {
                const approvedTeam = (session.participants || [])
                  .filter((p) => p.status === 'approved' || p.status === 'completed')
                  .sort((a, b) => (b.checkedIn ? 1 : 0) - (a.checkedIn ? 1 : 0));

                const currentMentee = approvedTeam.find((p) => p.checkedIn && p.status !== 'completed');
                const isBusy = !!currentMentee;

                return (
                  <div
                    key={session.id}
                    style={{
                      background: 'white',
                      borderRadius: '20px',
                      padding: '32px',
                      boxShadow: isBusy
                        ? '0 12px 36px rgba(239,68,68,0.15)'
                        : '0 12px 36px rgba(16,185,129,0.12)',
                      border: isBusy ? '2px solid #ef4444' : '2px solid #10b981',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img
                          src={
                            session.photoUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(session.mentorName)}&background=10b981&color=fff`
                          }
                          alt={session.mentorName}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            border: `3px solid ${isBusy ? '#ef4444' : '#10b981'}`,
                            objectFit: 'cover',
                          }}
                        />
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#111827' }}>{session.mentorName}</h3>
                          <div style={{ color: '#6b7280', fontSize: '1rem' }}>Room {session.room}</div>
                        </div>
                      </div>

                      <span
                        style={{
                          padding: '8px 20px',
                          borderRadius: '999px',
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          background: isBusy ? '#fee2e2' : '#ecfdf5',
                          color: isBusy ? '#b91c1c' : '#047857',
                        }}
                      >
                        {isBusy ? 'BUSY' : 'AVAILABLE'}
                      </span>
                    </div>

                    <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#374151', fontWeight: 600 }}>
                        Approved Participants
                      </h4>

                      {approvedTeam.length === 0 ? (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
                          No approved participants yet
                        </p>
                      ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {approvedTeam.map((p, idx) => {
                            const isCurrent = p.checkedIn && p.status !== 'completed';
                            const isDone = p.status === 'completed';

                            const displayName =
                              p.name ||
                              p.displayName ||
                              (p.email ? p.email.split('@')[0] : null) ||
                              'Participant';

                            return (
                              <li
                                key={idx}
                                style={{
                                  padding: '12px 16px',
                                  marginBottom: '10px',
                                  borderRadius: '10px',
                                  background: isCurrent ? '#f0fdfa' : isDone ? '#f3f4f6' : 'transparent',
                                  border: isCurrent ? '1px solid #5eead4' : isDone ? '1px dashed #cbd5e1' : 'none',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  opacity: isDone ? 0.7 : 1,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ color: '#6b7280', fontWeight: 600, minWidth: '32px' }}>
                                    #{idx + 1}
                                  </span>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <span
                                      style={{
                                        fontWeight: isCurrent ? 600 : 500,
                                        color: isDone ? '#9ca3af' : '#111827',
                                      }}
                                    >
                                      {displayName}
                                    </span>
                                    {isDone && (
                                      <span style={{
                                        fontSize: '0.85rem',
                                        color: '#7c3aed',
                                        fontWeight: 600,
                                        marginTop: '2px'
                                      }}>
                                        Done
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {isCurrent && (
                                  <span
                                    style={{
                                      background: '#ccfbf1',
                                      color: '#0f766e',
                                      padding: '6px 14px',
                                      borderRadius: '999px',
                                      fontSize: '0.9rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Current Session
                                  </span>
                                )}
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
          )}
        </div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'routine' && (
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '40px' }}>
            Approved Teams Schedule
          </h2>

          {sessions.length === 0 ? (
            <div
              style={{
                padding: '80px 32px',
                background: 'white',
                borderRadius: '20px',
                textAlign: 'center',
                boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
                color: '#6b7280',
              }}
            >
              <p style={{ fontSize: '1.4rem', marginBottom: '16px' }}>No approved bookings yet</p>
              <small style={{ fontSize: '1.1rem' }}>Schedule will appear once admin approves teams</small>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '20px', boxShadow: '0 12px 36px rgba(0,0,0,0.08)' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'white',
                  minWidth: '900px',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: '20px 24px',
                        background: '#6366f1',
                        color: 'white',
                        fontWeight: 600,
                        textAlign: 'left',
                        position: 'sticky',
                        left: 0,
                        zIndex: 10,
                        minWidth: '280px',
                        borderBottom: '3px solid #4f46e5',
                      }}
                    >
                      Mentor • Room
                    </th>
                    {Array.from({ length: Math.max(...sessions.map((s) => s.participants?.length || 0), 5) }).map((_, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '20px 24px',
                          background: '#6366f1',
                          color: 'white',
                          fontWeight: 600,
                          textAlign: 'center',
                          minWidth: '160px',
                          borderBottom: '3px solid #4f46e5',
                        }}
                      >
                        Slot {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allMentors.map((mentor, row) => {
                    const mentorSessions = sessions.filter((s) => s.mentorName === mentor);
                    const room = mentorSessions[0]?.room || '—';

                    const approved = mentorSessions
                      .flatMap((s) => s.participants || [])
                      .filter((p) => p.status === 'approved' || p.status === 'completed')
                      .map((p) => ({
                        name: p.name || 'Team',
                        status: p.status
                      }));

                    return (
                      <tr
                        key={mentor}
                        style={{ background: row % 2 === 0 ? '#f9fafb' : 'white' }}
                      >
                        <td
                          style={{
                            padding: '20px 24px',
                            fontWeight: 600,
                            color: '#111827',
                            borderRight: '1px solid #e5e7eb',
                            position: 'sticky',
                            left: 0,
                            background: row % 2 === 0 ? '#f9fafb' : 'white',
                            zIndex: 5,
                          }}
                        >
                          {mentor}
                          <div style={{ color: '#6b7280', fontSize: '0.95rem', marginTop: '6px' }}>
                            Room {room}
                          </div>
                        </td>

                        {Array.from({ length: Math.max(...sessions.map((s) => s.participants?.length || 0), 5) }).map((_, col) => {
                          const entry = approved[col];
                          const isDone = entry?.status === 'completed';

                          return (
                            <td
                              key={col}
                              style={{
                                padding: '20px 24px',
                                textAlign: 'center',
                                borderRight: '1px solid #e5e7eb',
                                color: entry ? '#1e40af' : '#9ca3af',
                                fontWeight: entry ? 600 : 400,
                              }}
                            >
                              {entry ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                  <span>{entry.name}</span>
                                  {isDone && (
                                    <span style={{
                                      fontSize: '0.85rem',
                                      color: '#7c3aed',
                                      fontWeight: 600
                                    }}>
                                      Done
                                    </span>
                                  )}
                                </div>
                              ) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPage;