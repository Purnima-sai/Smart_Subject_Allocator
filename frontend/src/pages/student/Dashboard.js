import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftPanelButton from '../components/LeftPanelButton';
// Removed localStorage subject dependency; subjects now fetched from backend
import { getCurrentUser } from '../utils/auth';
import PreferencePage from './PreferencePage';
import AllottedPage from './AllottedPage';
import AboutPanel from './AboutPanel';

export default function StudentDashboard(){
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [active, setActive] = useState('preference');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/students/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const studentData = await response.json();
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser({
          ...storedUser,
          email: studentData.email || storedUser.email,
          name: studentData.name || storedUser.name,
          year: studentData.year,
          semester: studentData.semester,
          cgpa: studentData.cgpa,
          rollNumber: studentData.rollNumber,
          department: studentData.department,
          preferences: studentData.preferences || [],
          preferencesLocked: studentData.preferencesLocked || false,
          preferencesSubmittedAt: studentData.preferencesSubmittedAt
        });
      } else if (response.status === 401) {
        localStorage.clear();
        navigate('/login', { replace: true });
        return;
      } else {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(storedUser);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const fetchSubjects = useCallback(async () => {
    if (!user || user.year == null || user.semester == null) return;
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`/api/subjects?year=${user.year}&semester=${user.semester}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        const normalized = (data.subjects || []).map(s => ({
          id: s._id,
          _id: s._id, // Keep both for compatibility
          code: s.code,
          name: s.title,
          title: s.title, // Keep both for compatibility
          year: s.year,
          semester: s.semester,
          capacity: s.capacity,
          faculty: s.instructor?.name || s.faculty || '',
          desc: s.description || 'No description available',
          description: s.description || 'No description available',
          topics: Array.isArray(s.topics) ? s.topics.join(', ') : '',
          credits: s.credits || 3,
          hours: s.hours || 3,
        }));
        setSubjects(normalized);
      } else {
        setSubjects([]);
      }
    } catch (e) {
      console.error('Failed to fetch subjects', e);
      setSubjects([]);
    }
  }, [user]);

  useEffect(() => {
    fetchSubjects();
    const interval = setInterval(fetchSubjects, 30000);
    const handleStorageSignal = (e) => {
      if (e.key === 'ssaems_subjects_dirty') {
        fetchSubjects();
      }
    };
    window.addEventListener('storage', handleStorageSignal);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageSignal);
    };
  }, [fetchSubjects]);

  return (
    <div>
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '1rem',
      }}>
        <h2 style={{ margin: 0 }}>Student Dashboard</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <div className="container dashboard" style={{ display: 'flex', gap: 16, padding: 16 }}>
          <aside className="leftcol" style={{ width: 320, flexShrink: 0 }}>
            <div className="profile card" style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <h3 style={{ marginTop: 0 }}>{user?.name || 'Student'}</h3>
              <p><strong>Roll No:</strong> {user?.rollNumber || user?.idNumber || 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Year:</strong> {user?.year || 'N/A'} | <strong>Semester:</strong> {user?.semester || 'N/A'}</p>
              <p><strong>CGPA:</strong> {user?.cgpa || 'N/A'}</p>
            </div>

            <LeftPanelButton
              title="Elective Preference"
              desc="Submit ranked elective choices"
              active={active==='preference'}
              onClick={()=>setActive('preference')}
            />
            <LeftPanelButton
              title="Allotted Electives"
              desc="View your allotted course and change request"
              active={active==='allotted'}
              onClick={()=>setActive('allotted')}
            />
            <LeftPanelButton
              title="About"
              desc="Course details and credits"
              active={active==='about'}
              onClick={()=>setActive('about')}
            />
          </aside>

          <section className="maincol" style={{ flex: 1, minWidth: 0 }}>
            {active === 'preference' && (
              <PreferencePage
                subjects={subjects}
                user={user}
                onSubmitted={async () => {
                  // Optimistically mark locked
                  setUser((prev) => prev ? { ...prev, preferencesLocked: true, preferencesSubmittedAt: new Date().toISOString() } : prev);
                  await fetchStudentData();
                }}
              />
            )}
            {active === 'allotted' && (
              <AllottedPage user={user} subjects={subjects} />
            )}
            {active === 'about' && (
              <AboutPanel subjects={subjects} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}