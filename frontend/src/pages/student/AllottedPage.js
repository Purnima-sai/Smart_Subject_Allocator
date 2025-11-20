import React, { useState, useEffect } from 'react';

export default function AllottedPage({ user, subjects = [] }) {
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wantsChange, setWantsChange] = useState('no');
  const [reason, setReason] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch allocation from backend
  useEffect(() => {
    const fetchAllocation = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch('/api/students/allocation', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Allocation data:', data);
          setAllocation(data);
        } else {
          console.error('Failed to fetch allocation');
          setAllocation({ allocated: false });
        }
      } catch (err) {
        console.error('Error fetching allocation:', err);
        setAllocation({ allocated: false });
      } finally {
        setLoading(false);
      }
    };

    fetchAllocation();
  }, []);

  const handleChangeRequest = async () => {
    setError('');
    setSuccess('');
    
    if (wantsChange === 'yes' && (!reason.trim() || !newCourse)) {
      setError('Please provide a reason and select a preferred course.');
      return;
    }

    if (wantsChange === 'no') {
      setSuccess('Thank you for confirming. No change request submitted.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/change-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentSubjectId: allocation.allocation.subject._id,
          requestedSubjectId: newCourse,
          reason: reason
        })
      });

      if (response.ok) {
        setSuccess('Change request submitted successfully. Admin will review your request.');
        setReason('');
        setNewCourse('');
        setWantsChange('no');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit change request');
      }
    } catch (err) {
      console.error('Error submitting change request:', err);
      setError('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading allocation status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>📚 Allotted Elective</h3>
      
      {error && (
        <div style={{ background: '#ffebee', color: '#b71c1c', border: '1px solid #ffcdd2', borderRadius: 8, padding: 10, marginBottom: 10 }}>
          ⚠️ {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9', borderRadius: 8, padding: 10, marginBottom: 10 }}>
          ✓ {success}
        </div>
      )}

      {/* Not Allocated Yet */}
      {!allocation?.allocated && (
        <div>
          <div style={{ 
            background: '#fff3e0', 
            border: '1px solid #ffb74d', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ fontSize: '32px' }}>⏳</div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#e65100', marginBottom: 4 }}>
                Awaiting Allocation
              </div>
              <div style={{ fontSize: '14px', color: '#bf360c' }}>
                {allocation?.message || 'Subject allocation has not been completed yet. Please check back later.'}
              </div>
            </div>
          </div>

          {user?.preferences && user.preferences.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 12, color: '#1976d2' }}>Your Submitted Preferences:</h4>
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {user.preferences.map((pref, idx) => (
                  <li key={pref._id || idx} style={{ 
                    marginBottom: 8,
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    borderLeft: '3px solid #1976d2'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                      {pref.code} - {pref.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                      {pref.credits} Credits • Year {pref.year} • Sem {pref.semester}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Allocated */}
      {allocation?.allocated && allocation.allocation && (
        <div>
          <div style={{ 
            background: '#e8f5e9', 
            border: '2px solid #4caf50', 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 20 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: '40px' }}>✅</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32', marginBottom: 4 }}>
                  Allocation Successful!
                </div>
                <div style={{ fontSize: '13px', color: '#558b2f' }}>
                  You have been allocated to the following subject
                </div>
              </div>
            </div>

            {/* Subject Details Card */}
            <div style={{ 
              background: '#fff', 
              border: '1px solid #c8e6c9',
              borderRadius: 10, 
              padding: 16,
              marginTop: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976d2', marginBottom: 4 }}>
                    {allocation.allocation.subject.code}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: 8 }}>
                    {allocation.allocation.subject.title}
                  </div>
                </div>
                <div style={{
                  background: '#1976d2',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  Section {allocation.allocation.section}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
                <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: 2 }}>Credits</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                    {allocation.allocation.subject.credits || 3}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: 2 }}>Hours/Week</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                    {allocation.allocation.subject.hours || 3}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: 2 }}>Year</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                    {allocation.allocation.subject.year}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: 2 }}>Semester</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                    {allocation.allocation.subject.semester}
                  </div>
                </div>
              </div>

              {allocation.allocation.priority && (
                <div style={{ 
                  marginTop: 12, 
                  padding: '10px 12px', 
                  background: '#fff8e1', 
                  border: '1px solid #ffd54f',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: '18px' }}>🎯</span>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#f57c00' }}>
                      Allocated: Priority {allocation.allocation.priority}
                    </span>
                    <span style={{ fontSize: '13px', color: '#e65100', marginLeft: 8 }}>
                      (Your choice #{allocation.allocation.priority})
                    </span>
                  </div>
                </div>
              )}

              {allocation.allocation.subject.faculty && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: 4 }}>Faculty</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1976d2' }}>
                    {allocation.allocation.subject.faculty}
                  </div>
                </div>
              )}

              {allocation.allocation.subject.description && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: '14px', color: '#555', lineHeight: 1.5 }}>
                    {allocation.allocation.subject.description}
                  </div>
                </div>
              )}

              {allocation.allocation.subject.topics && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: 6 }}>Topics Covered</div>
                  <div style={{ fontSize: '14px', color: '#555' }}>
                    {allocation.allocation.subject.topics}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Change Request Section */}
          <div style={{ marginTop: 20, padding: 16, background: '#f5f7fb', borderRadius: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '15px' }}>
              📝 Do you want to change your allotted elective?
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="change" 
                  value="yes" 
                  checked={wantsChange === 'yes'} 
                  onChange={(e) => setWantsChange(e.target.value)} 
                />
                <span>Yes, I want to request a change</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="change" 
                  value="no" 
                  checked={wantsChange === 'no'} 
                  onChange={(e) => setWantsChange(e.target.value)} 
                />
                <span>No, I'm satisfied</span>
              </label>
            </div>

            {wantsChange === 'yes' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 }}>
                    Reason for Change Request *
                  </label>
                  <textarea 
                    rows={4} 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Please provide a detailed reason for requesting a change..."
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      borderRadius: 8, 
                      border: '1px solid #d0d0d0',
                      fontSize: '14px',
                      fontFamily: 'inherit'
                    }} 
                  />
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 }}>
                    Preferred Alternative Subject *
                  </label>
                  <select 
                    value={newCourse} 
                    onChange={(e) => setNewCourse(e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: 10, 
                      borderRadius: 8, 
                      border: '1px solid #d0d0d0',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">-- Select a subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button 
                onClick={handleChangeRequest} 
                style={{ 
                  background: wantsChange === 'yes' ? '#1976d2' : '#4caf50', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                {wantsChange === 'yes' ? 'Submit Change Request' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
