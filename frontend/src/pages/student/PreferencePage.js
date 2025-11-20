import React, { useMemo, useState } from 'react';
import { saveSubjects } from '../utils/auth';

export default function PreferencePage({ subjects = [], user, onSubmitted }) {
  const [prefs, setPrefs] = useState(() => {
    // Initialize from user's existing preferences if locked
    if (user && user.preferences && user.preferences.length > 0) {
      const prefMap = {};
      user.preferences.forEach((pref, index) => {
        prefMap[pref._id] = index + 1; // Priority is index + 1
      });
      return prefMap;
    }
    // Otherwise check localStorage
    try {
      const raw = localStorage.getItem('ssaems_prefs');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {};
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);
  const isLocked = (user && user.preferencesLocked) || justSubmitted;

  const list = useMemo(() => {
    // If no subjects provided, seed with defaults
    if (!subjects || subjects.length === 0) {
      const seed = [
        { id: 'CS501', name: 'Advanced Machine Learning', desc: 'Deep learning, RL, CNNs, RNNs' },
        { id: 'CS502', name: 'Cloud Computing', desc: 'Virtualization, containers, serverless' },
        { id: 'CS503', name: 'Blockchain Technology', desc: 'Cryptography, ledgers, smart contracts' },
        { id: 'CS504', name: 'Data Visualization', desc: 'D3, dashboards, design best practices' },
        { id: 'CS505', name: 'Cybersecurity Basics', desc: 'Threats, vulns, defenses' },
        { id: 'CS506', name: 'NLP Fundamentals', desc: 'Tokenization, LMs, transformers' },
        { id: 'CS507', name: 'IoT Systems', desc: 'Edge nodes, protocols, gateways' },
        { id: 'CS508', name: 'Big Data Analytics', desc: 'Hadoop/Spark, ETL, pipelines' },
        { id: 'CS509', name: 'Computer Vision', desc: 'Image processing, detection' },
        { id: 'CS510', name: 'Edge Computing', desc: 'Distributed compute near data sources' },
      ];
      // persist seed so other pages can see them
      saveSubjects(seed);
      return seed;
    }
    return subjects;
  }, [subjects]);

  const setPriority = (id, v) => {
    const num = Number(v);
    const next = { ...prefs, [id]: isNaN(num) ? '' : num };
    setPrefs(next);
    // validations
    const values = Object.values(next).filter((x) => x !== '' && !isNaN(x));
    const unique = new Set(values);
    if (values.some((n) => n < 1 || n > 10)) setError('Priorities must be in 1..10');
    else if (unique.size !== values.length) setError('Each priority must be unique');
    else setError('');
  };

  const onSubmit = async () => {
    // Prevent submission if already locked
    if (isLocked) {
      setError('Preferences are already locked and cannot be modified');
      return;
    }
    
    if (error) return;
    const selected = Object.entries(prefs)
      .filter(([_, v]) => v && !isNaN(v))
      .map(([id, priority]) => ({ id, priority: Number(priority) }))
      .sort((a, b) => a.priority - b.priority);
    if (selected.length === 0) {
      setError('Please choose at least one preference');
      return;
    }
    
    try {
      // Send preferences to backend
      const token = localStorage.getItem('token');
      const preferences = selected.map(s => s.id); // Array of subject IDs
      
      console.log('Submitting preferences:', preferences);
      console.log('Selected subjects with priorities:', selected);
      
      const response = await fetch('/api/students/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferences })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to submit preferences');
      }
      
      const responseData = await response.json();
      console.log('Success response:', responseData);
      
      // Show success message first
      setSuccess('Preferences submitted and locked successfully! Refreshing...');
      setError(''); // Clear any errors
      
      // Also save to localStorage for backward compatibility
      const raw = localStorage.getItem('ssaems_prefs');
      const obj = raw ? JSON.parse(raw) : {};
      const map = (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
      if (user && user.idNumber) {
        map[user.idNumber] = selected;
        localStorage.setItem('ssaems_prefs', JSON.stringify(map));
      }
      
      // Mark as locked locally to immediately disable UI
      setJustSubmitted(true);

      // Call parent callback to refresh profile/state
      if (typeof onSubmitted === 'function') {
        try {
          await onSubmitted();
        } catch (e) {
          // ignore callback errors
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to submit preferences');
      console.error('Preference submission error:', err);
    }
  };

  return (
    <div className="card" style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Elective Preference</h3>
      
      {isLocked && (
        <div style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffc107', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <strong>🔒 Preferences Locked</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
            Your preferences have been submitted and locked. You can view them below but cannot modify them.
            {user.preferencesSubmittedAt && (
              <span style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
                Submitted on: {new Date(user.preferencesSubmittedAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>
      )}
      
      {!isLocked && (
        <p style={{ color: '#666', marginTop: -8 }}>Assign a unique priority (1-10) for each course you want.</p>
      )}
      
      {error && <div style={{ color: '#b00020', marginBottom: 8 }}>{error}</div>}
      {success && (
        <div style={{ background: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9', borderRadius: 8, padding: 10, marginBottom: 10 }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {list.map((s) => (
          <div key={s.id} className="card" style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ color: '#666', fontSize: 13 }}>{s.id}</div>
                {(s.year || s.semester) && (
                  <div style={{ color: '#1976d2', fontSize: 12, marginTop: 4 }}>
                    {s.year && `Year ${s.year}`}{s.year && s.semester && ' • '}{s.semester && `Sem ${s.semester}`}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => alert(`${s.name}\n\n${s.desc}`)}
                style={{ border: '1px solid #e0e0e0', background: '#fff', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
              >
                Description
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 13, color: '#444' }}>Priority</label>
              <input
                type="number"
                min={1}
                max={10}
                value={prefs[s.id] ?? ''}
                onChange={(e) => setPriority(s.id, e.target.value)}
                disabled={isLocked}
                style={{ 
                  width: 120, 
                  padding: 8, 
                  borderRadius: 8, 
                  border: '1px solid #e0e0e0',
                  background: isLocked ? '#f5f5f5' : '#fff',
                  cursor: isLocked ? 'not-allowed' : 'text'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {!isLocked && (
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <button onClick={onSubmit} style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>
            Submit Preferences
          </button>
        </div>
      )}
    </div>
  );
}
