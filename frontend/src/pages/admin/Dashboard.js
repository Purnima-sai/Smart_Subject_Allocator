import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Tooltip as MuiTooltip,
  Badge,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  GetApp as GetAppIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function AdminDashboard(){
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({labels:[],data:[]});
  const [activeTab, setActiveTab] = useState('overview');
  // Removed: showUploadDialog, uploadedFile (old localStorage-based upload feature)
  
  const [newSubject, setNewSubject] = useState({name:'', credits:3, hours:3, capacity:30, faculty:'', description:'', topics:'', year:'', semester:''});
  const [editingSubject, setEditingSubject] = useState(null);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [preferencesFile, setPreferencesFile] = useState(null);
  const [uploadingPreferences, setUploadingPreferences] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationResults, setAllocationResults] = useState(null);
  const [runningAllocation, setRunningAllocation] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    maxPreferences: 5,
    allocationLocked: false,
    registrationOpen: true,
    semester: 'Fall 2025'
  });
  const [runningFacultyAllocation, setRunningFacultyAllocation] = useState(false);
  const [facultyAllocationResults, setFacultyAllocationResults] = useState(null);
  
  // Dashboard statistics
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalAllocated: 0,
    pendingRequests: 0
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  // Load dashboard statistics from backend
  async function loadDashboardStats() {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch registered students count
      const studentsResp = await fetch('/api/admin/registered-electives', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let totalStudents = 0;
      if (studentsResp.ok) {
        const studentsData = await studentsResp.json();
        totalStudents = (studentsData.registrations || []).length;
      }
      
      // Fetch allocations and count unique students
      const allocResp = await fetch('/api/faculty/allocations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      let totalAllocated = 0;
      if (allocResp.ok) {
        const allocData = await allocResp.json();
        const allocations = allocData.allocations || [];
        
        // Count unique students who have been allocated
        const uniqueStudents = new Set();
        allocations.forEach(allocation => {
          if (allocation.student && allocation.student.id) {
            uniqueStudents.add(allocation.student.id);
          }
        });
        totalAllocated = uniqueStudents.size;
      }
      
      setDashboardStats({
        totalStudents,
        totalAllocated,
        pendingRequests: 0 // TODO: Fetch from backend if requests API exists
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }

  useEffect(()=>{
    // Load subjects from backend instead of localStorage
    const loadSubjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const resp = await fetch('/api/admin/subjects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          const mapped = (data.subjects || []).map(s => ({
            id: s._id,
            code: s.code,
            name: s.title,
            capacity: s.capacity,
            faculty: s.instructor?.name || '',
            year: String(s.year),
            semester: String(s.semester),
            credits: s.credits || 3,
            hours: s.hours || 3,
            description: s.description || '',
            topics: s.topics || [],
          }));
          setSubjects(mapped);
          computeStats(mapped);
        } else {
          setSubjects([]);
        }
      } catch (e) {
        console.error('Failed to load subjects', e);
        setSubjects([]);
      } finally {
        loadAllocationHistory();
        loadSystemSettings();
        fetchRegisteredElectives(); // Load registered students on mount
        loadDashboardStats(); // Load dashboard statistics
      }
    };
    loadSubjects();
  },[]);

  async function loadAllocationHistory() {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch snapshots from backend
      const snapshotsResp = await fetch('/api/allocation/snapshots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (snapshotsResp.ok) {
        const snapshotsData = await snapshotsResp.json();
        const snapshots = snapshotsData.snapshots || [];
        
        // Fetch current allocation data to get statistics
        const allocResp = await fetch('/api/faculty/allocations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const studentsResp = await fetch('/api/admin/registered-electives', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let currentAllocations = [];
        let totalStudents = 0;
        
        if (allocResp.ok) {
          const allocData = await allocResp.json();
          currentAllocations = allocData.allocations || [];
        }
        
        if (studentsResp.ok) {
          const studentsData = await studentsResp.json();
          totalStudents = (studentsData.registrations || []).filter(s => s.preferencesLocked).length;
        }
        
        // If we have current data, add it as the most recent entry
        const history = [];
        
        if (totalStudents > 0) {
          // Count unique students who have allocations
          const uniqueAllocatedStudents = new Set();
          currentAllocations.forEach(allocation => {
            if (allocation.student && allocation.student.id) {
              uniqueAllocatedStudents.add(allocation.student.id);
            }
          });
          
          const allocated = uniqueAllocatedStudents.size;
          const unallocated = totalStudents - allocated;
          const allocatedPercentage = totalStudents > 0 ? ((allocated / totalStudents) * 100).toFixed(1) : '0.0';
          
          history.push({
            date: new Date().toISOString(),
            totalStudents,
            allocated,
            unallocated,
            allocatedPercentage
          });
        }
        
        // Add historical snapshots if available
        snapshots.forEach(snapshot => {
          // Count unique students in snapshot
          const uniqueStudents = new Set();
          if (snapshot.allocations) {
            snapshot.allocations.forEach(alloc => {
              if (alloc.student) {
                uniqueStudents.add(alloc.student.toString());
              }
            });
          }
          
          const allocated = uniqueStudents.size;
          
          history.push({
            date: snapshot.createdAt,
            totalStudents: allocated, // We don't have historical total, so use allocated as reference
            allocated,
            unallocated: 0,
            allocatedPercentage: '100.0'
          });
        });
        
        setAllocationHistory(history);
      } else {
        // Fallback to empty array if fetch fails
        setAllocationHistory([]);
      }
    } catch (error) {
      console.error('Error loading allocation history:', error);
      setAllocationHistory([]);
    }
  }

  function loadSystemSettings() {
    const settings = JSON.parse(localStorage.getItem('ssaems_system_settings') || 'null');
    if (settings) setSystemSettings(settings);
  }

  function saveSystemSettings() {
    localStorage.setItem('ssaems_system_settings', JSON.stringify(systemSettings));
    alert('System settings saved successfully!');
  }

  async function computeStats(s){
    try {
      const token = localStorage.getItem('token');
      
      // Fetch allocation data from backend (using faculty route that also accepts admin)
      const response = await fetch('/api/faculty/allocations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        const allocations = result.allocations || [];
        const counts = {};
        
        // Count allocations per subject
        allocations.forEach(allocation => {
          if (allocation.subject && allocation.subject._id) {
            const subjectId = allocation.subject._id;
            counts[subjectId] = (counts[subjectId] || 0) + 1;
          }
        });
        
        // Map to chart data
        const labels = s.map(x => x.name);
        const data = s.map(x => counts[x.id] || 0);
        setStats({labels, data});
      } else {
        // Fallback to empty data if fetch fails
        const labels = s.map(x => x.name);
        const data = s.map(x => 0);
        setStats({labels, data});
      }
    } catch (error) {
      console.error('Error fetching allocation stats:', error);
      // Fallback to empty data
      const labels = s.map(x => x.name);
      const data = s.map(x => 0);
      setStats({labels, data});
    }
  }

  // Unified allocation function - handles CSV upload if provided, then runs allocation
  async function runUnifiedAllocation() {
    if (systemSettings.allocationLocked) {
      alert('Allocation is locked! Unlock in settings to run allocation.');
      return;
    }

    setRunningAllocation(true);
    setAllocationResults(null);

    try {
      const token = localStorage.getItem('token');

      // Step 2: Run allocation algorithm
      const response = await fetch('/api/admin/run-allocation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to run allocation';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`;
          }
        } catch (parseError) {
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Store results and show modal
      setAllocationResults(result);
      setShowAllocationModal(true);

      // Refresh data
      loadAllocationHistory();
      computeStats(subjects);
      fetchRegisteredElectives();
      loadDashboardStats(); // Refresh dashboard statistics
      
    } catch (error) {
      console.error('Error running allocation:', error);
      alert('❌ Allocation Failed: ' + error.message);
    } finally {
      setRunningAllocation(false);
    }
  }

  async function runAllocation(){
    if (systemSettings.allocationLocked) {
      alert('Allocation is locked! Unlock in settings to run allocation.');
      return;
    }

    const confirm = window.confirm(
      '⚠️ This will run the allocation algorithm based on student preferences and CGPA.\n\n' +
      'Students with higher CGPA will get priority for their preferred subjects.\n\n' +
      'Any existing allocations will be cleared. Continue?'
    );

    if (!confirm) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/run-allocation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to run allocation');
      }

      const result = await response.json();
      
      // Show detailed results
      let message = `✅ Allocation Algorithm Completed!\n\n`;
      message += `📊 Statistics:\n`;
      message += `• Total Students: ${result.statistics.totalStudents}\n`;
      message += `• Successfully Allocated: ${result.statistics.allocated}\n`;
      message += `• Unallocated: ${result.statistics.unallocated}\n`;
      message += `• Success Rate: ${result.statistics.allocationPercentage}%\n\n`;
      
      if (result.subjectStats && result.subjectStats.length > 0) {
        message += `📘 Subject-wise Allocation:\n`;
        result.subjectStats.forEach(stat => {
          message += `• ${stat.subjectCode}: ${stat.totalAllocated} students`;
          const sections = Object.entries(stat.sections).map(([sec, count]) => `${sec}(${count})`).join(', ');
          message += ` - Sections: ${sections}`;
          if (stat.cgpaCutoff) {
            message += ` - Cutoff CGPA: ${stat.cgpaCutoff.toFixed(2)}`;
          }
          message += `\n`;
        });
      }

      if (result.unallocatedStudents && result.unallocatedStudents.length > 0) {
        message += `\n⚠️ Unallocated Students:\n`;
        result.unallocatedStudents.slice(0, 5).forEach(s => {
          message += `• ${s.name} (CGPA: ${s.cgpa})\n`;
        });
        if (result.unallocatedStudents.length > 5) {
          message += `... and ${result.unallocatedStudents.length - 5} more\n`;
        }
      }

      alert(message);

      // Refresh data
      loadAllocationHistory();
      computeStats(subjects);
      fetchRegisteredElectives();
      
    } catch (error) {
      console.error('Error running allocation:', error);
      alert('❌ Failed to run allocation: ' + error.message);
    }
  }

  async function uploadPreferencesCSV() {
    if (!preferencesFile) {
      alert('Please select a CSV file first');
      return;
    }

    const confirm = window.confirm(
      '⚠️ This will upload student preferences from the CSV file.\n\n' +
      'CSV Format:\n' +
      'Student_ID, CGPA, Subject1, Subject2, Subject3, Subject4, Subject5\n\n' +
      'Existing preferences will be overwritten. Continue?'
    );

    if (!confirm) return;

    setUploadingPreferences(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', preferencesFile);

      const response = await fetch('/api/admin/upload-preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload preferences');
      }

      const result = await response.json();

      let message = `✅ Preferences Upload Complete!\n\n`;
      message += `📊 Statistics:\n`;
      message += `• Total Rows: ${result.statistics.totalRows}\n`;
      message += `• Successfully Uploaded: ${result.statistics.successCount}\n`;
      message += `• Errors: ${result.statistics.errorCount}\n\n`;

      if (result.statistics.errors && result.statistics.errors.length > 0) {
        message += `⚠️ Errors:\n`;
        result.statistics.errors.forEach(err => {
          message += `• ${err}\n`;
        });
      }

      alert(message);

      // Clear file and refresh data
      setPreferencesFile(null);
      fetchRegisteredElectives();

    } catch (error) {
      console.error('Error uploading preferences:', error);
      alert('❌ Failed to upload preferences: ' + error.message);
    } finally {
      setUploadingPreferences(false);
    }
  }

  // NOTE: Old localStorage-based allocation functions removed
  // Now using MongoDB-backed API: runUnifiedAllocation() which calls /api/admin/run-allocation

  async function exportCSV() {
    try {
      const token = localStorage.getItem('token');
      
      // Show loading state
      const exportButton = document.querySelector('button[onClick="exportCSV"]');
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.textContent = '⏳ Exporting...';
      }

      const response = await fetch('/api/admin/export-allocation-csv', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert('No allocation data found. Please run allocation first.');
        } else {
          const error = await response.json();
          alert('Export failed: ' + (error.message || 'Unknown error'));
        }
        return;
      }

      // Get the CSV content
      const csvContent = await response.text();
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'allocation_results.csv';
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✓ CSV exported successfully:', filename);

    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV: ' + error.message);
    } finally {
      // Reset button state
      const exportButton = document.querySelector('button[onClick="exportCSV"]');
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = '📥 Export CSV';
      }
    }
  }

  // Faculty Allocation Functions
  async function runFacultyAllocation() {
    setRunningFacultyAllocation(true);
    setFacultyAllocationResults(null);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      console.log('Calling faculty allocation API...');
      const response = await fetch('/api/admin/allocate-faculty', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Faculty allocation failed';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Server response (not JSON):', text.substring(0, 200));
            errorMessage = `Server error (${response.status}). Check console for details.`;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        alert(errorMessage);
        return;
      }

      const result = await response.json();
      console.log('Faculty allocation result:', result);

      setFacultyAllocationResults(result);
      alert(`✅ Faculty allocation completed!\n\n` +
            `Allocated Sections: ${result.allocatedSections}\n` +
            `Unallocated Sections: ${result.unallocatedSections}\n` +
            `Success Rate: ${result.statistics.successRate}`);

    } catch (error) {
      console.error('Error running faculty allocation:', error);
      alert('Failed to run faculty allocation: ' + error.message);
    } finally {
      setRunningFacultyAllocation(false);
    }
  }

  async function exportFacultyCSV() {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/export-faculty-allocation-csv', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert('No faculty allocation data found. Please run faculty allocation first.');
        } else {
          const error = await response.json();
          alert('Export failed: ' + (error.message || 'Unknown error'));
        }
        return;
      }

      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'faculty_allocation_results.csv';
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✓ Faculty CSV exported successfully:', filename);

    } catch (error) {
      console.error('Error exporting faculty CSV:', error);
      alert('Failed to export faculty CSV: ' + error.message);
    }
  }

  async function addSubject() {
    if (!newSubject.name.trim()) return alert('Subject name is required');
    if (!newSubject.year) return alert('Year is required');
    if (!newSubject.semester) return alert('Semester is required');
    try {
      const token = localStorage.getItem('token');
      console.log('Admin token for subject creation:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }
      // Generate a simple code if not provided
      const code = (newSubject.name || 'SUBJ').toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 12) + '_' + Math.random().toString(36).slice(-4).toUpperCase();
      const body = {
        code,
        title: newSubject.name,
        capacity: Number(newSubject.capacity) || 30,
        year: Number(newSubject.year),
        semester: Number(newSubject.semester),
        credits: Number(newSubject.credits) || 3,
        hours: Number(newSubject.hours) || 3,
        description: newSubject.description || '',
        topics: (newSubject.topics || '').split(',').map(t => t.trim()).filter(Boolean),
        faculty: newSubject.faculty || '',
      };
      const resp = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create subject');
      }
      const data = await resp.json();
      const s = data.subject;
      const mapped = {
        id: s._id,
        code: s.code || code,
        name: s.title,
        capacity: s.capacity,
        faculty: s.instructor?.name || '',
        year: String(s.year),
        semester: String(s.semester),
        credits: newSubject.credits,
        hours: newSubject.hours,
        description: newSubject.description,
        topics: (newSubject.topics || '').split(',').map(t => t.trim()).filter(Boolean),
      };
      const updated = [...subjects, mapped];
      setSubjects(updated);
      computeStats(updated);
      setNewSubject({name:'', credits:3, hours:3, capacity:30, faculty:'', description:'', topics:'', year:'', semester:''});
      alert('Subject added successfully!');
      // signal other tabs/windows (students) to refresh
      try { localStorage.setItem('ssaems_subjects_dirty', String(Date.now())); } catch (_) {}
    } catch (e) {
      alert(e.message);
    }
  }

  function editSubject(subject) {
    setEditingSubject({
      ...subject,
      topics: Array.isArray(subject.topics) ? subject.topics.join(', ') : (subject.topics || '')
    });
  }

  async function updateSubject() {
    if (!editingSubject.year) return alert('Year is required');
    if (!editingSubject.semester) return alert('Semester is required');
    try {
      const token = localStorage.getItem('token');
      const body = {
        title: editingSubject.name,
        capacity: Number(editingSubject.capacity) || 30,
        year: Number(editingSubject.year),
        semester: Number(editingSubject.semester),
        credits: Number(editingSubject.credits) || 3,
        hours: Number(editingSubject.hours) || 3,
        description: editingSubject.description || '',
        topics: typeof editingSubject.topics === 'string' 
          ? editingSubject.topics.split(',').map(t => t.trim()).filter(Boolean)
          : editingSubject.topics || [],
        faculty: editingSubject.faculty || '',
      };
      const resp = await fetch(`/api/admin/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update subject');
      }
      const data = await resp.json();
      const s = data.subject;
      const mapped = {
        id: s._id,
        name: s.title,
        code: s.code,
        capacity: s.capacity,
        faculty: s.instructor?.name || s.faculty || '',
        year: String(s.year),
        semester: String(s.semester),
        credits: s.credits || 3,
        hours: s.hours || 3,
        description: s.description || '',
        topics: Array.isArray(s.topics) ? s.topics : [],
      };
      const updated = subjects.map(x => x.id === mapped.id ? mapped : x);
      setSubjects(updated);
      computeStats(updated);
      setEditingSubject(null);
      alert('Subject updated successfully!');
      try { localStorage.setItem('ssaems_subjects_dirty', String(Date.now())); } catch (_) {}
    } catch (e) {
      alert(e.message);
    }
  }

  async function deleteSubject(id) {
    const userConfirmed = window.confirm('Are you sure you want to delete this subject?');
    if (!userConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`/api/admin/subjects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete subject');
      }
      const updated = subjects.filter(s => s.id !== id);
      setSubjects(updated);
      computeStats(updated);
      alert('Subject deleted successfully!');
      try { localStorage.setItem('ssaems_subjects_dirty', String(Date.now())); } catch (_) {}
    } catch (e) {
      alert(e.message);
    }
  }

  function clearAllAllocations() {
    const userConfirmed = window.confirm('Are you sure you want to clear ALL allocations? This cannot be undone.');
    if (!userConfirmed) return;
    localStorage.removeItem('ssaems_allotments');
    localStorage.removeItem('ssaems_requests');
    alert('All allocations and requests cleared!');
    computeStats(subjects);
  }

  async function generateReports() {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all necessary data from backend
      const [studentsResp, allocResp] = await Promise.all([
        fetch('/api/admin/registered-electives', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/faculty/allocations', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      let totalStudents = 0;
      let studentsWithPreferences = 0;
      let allocatedStudents = 0;
      
      if (studentsResp.ok) {
        const studentsData = await studentsResp.json();
        const registrations = studentsData.registrations || [];
        totalStudents = registrations.length;
        studentsWithPreferences = registrations.filter(s => 
          s.preferences && s.preferences.length > 0
        ).length;
      }
      
      if (allocResp.ok) {
        const allocData = await allocResp.json();
        const allocations = allocData.allocations || [];
        
        // Count unique students who have been allocated
        const uniqueStudents = new Set();
        allocations.forEach(allocation => {
          if (allocation.student && allocation.student.id) {
            uniqueStudents.add(allocation.student.id);
          }
        });
        allocatedStudents = uniqueStudents.size;
      }
      
      const allocationRate = totalStudents > 0 
        ? ((allocatedStudents / totalStudents) * 100).toFixed(1) + '%'
        : '0.0%';
      
      const report = {
        totalStudents,
        totalSubjects: subjects.length,
        studentsWithPreferences,
        allocatedStudents,
        unallocatedStudents: totalStudents - allocatedStudents,
        allocationRate
      };
      
      alert(
        '📊 System Report\n\n' +
        `👥 Total Students: ${report.totalStudents}\n` +
        `📚 Total Subjects: ${report.totalSubjects}\n` +
        `📝 Students with Preferences: ${report.studentsWithPreferences}\n` +
        `✅ Allocated Students: ${report.allocatedStudents}\n` +
        `❌ Unallocated Students: ${report.unallocatedStudents}\n` +
        `📈 Allocation Rate: ${report.allocationRate}`
      );
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + error.message);
    }
  }

  function handleRequest(requestId, action, adminNote = '') {
    const requests = JSON.parse(localStorage.getItem('ssaems_requests')||'[]');
    const requestIndex = requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return alert('Request not found');
    const request = requests[requestIndex];
    requests[requestIndex] = {
      ...request,
      status: action,
      adminNote,
      resolvedBy: 'Admin',
      resolvedAt: new Date().toISOString()
    };
    localStorage.setItem('ssaems_requests', JSON.stringify(requests));
    if (action === 'approved') {
      const allotments = JSON.parse(localStorage.getItem('ssaems_allotments')||'{}');
      const requestedSubject = subjects.find(s => s.id === request.requested);
      if (requestedSubject) {
        allotments[request.student] = {
          id: requestedSubject.id,
          name: requestedSubject.name,
          faculty: requestedSubject.faculty,
          hours: requestedSubject.hours,
          credits: requestedSubject.credits
        };
        localStorage.setItem('ssaems_allotments', JSON.stringify(allotments));
      }
    }
    alert(`Request ${action} successfully!`);
    computeStats(subjects);
  }

  function bulkApproveRequests(requestIds) {
    const userConfirmed = window.confirm(`Are you sure you want to approve ${requestIds.length} requests?`);
    if (!userConfirmed) return;
    requestIds.forEach(id => handleRequest(id, 'approved', 'Bulk approved by admin'));
  }

  function bulkDenyRequests(requestIds) {
    const userConfirmed = window.confirm(`Are you sure you want to deny ${requestIds.length} requests?`);
    if (!userConfirmed) return;
    requestIds.forEach(id => handleRequest(id, 'denied', 'Bulk denied by admin'));
  }

  // Admin utility: call backend to backfill missing subject codes
  async function backfillSubjectCodes() {
    const ok = window.confirm('Backfill missing subject codes for existing subjects? This will assign generated codes to any subject without one.');
    if (!ok) return;
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/admin/subjects/backfill-codes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Backfill failed');
      }
      const data = await resp.json();
      alert(`Backfill complete. ${data.updated || data.updatedCount || 0} subjects updated.`);
      // reload subjects list
      window.location.reload();
    } catch (e) {
      alert(e.message || 'Backfill failed');
    }
  }

  // Admin utility: delete all subjects (destructive)
  async function clearAllSubjects() {
    const userConfirmed = window.confirm('DELETE ALL SUBJECTS? This cannot be undone. Are you sure?');
    if (!userConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/admin/subjects', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Clear failed');
      }
      const data = await resp.json();
      alert(data.message || 'All subjects cleared');
      setSubjects([]);
      computeStats([]);
      try { localStorage.setItem('ssaems_subjects_dirty', String(Date.now())); } catch (_) {}
    } catch (e) {
      alert(e.message || 'Clear failed');
    }
  }

  async function fetchRegisteredElectives() {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/admin/registered-electives', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setRegisteredStudents(data.registrations || []);
      } else {
        setRegisteredStudents([]);
      }
    } catch (e) {
      console.error('Failed to fetch registered electives', e);
      setRegisteredStudents([]);
    }
  }

  function downloadRegisteredElectivesExcel() {
    if (registeredStudents.length === 0) {
      alert('No registrations to download');
      return;
    }

    // Create CSV content
    let csv = 'Roll Number,Name,Email,Department,Year,Semester,CGPA,Priority 1,Priority 2,Priority 3,Priority 4,Priority 5\n';
    
    registeredStudents.forEach(student => {
      const prefs = student.preferences || [];
      const p1 = prefs[0] ? `${prefs[0].code} - ${prefs[0].title}` : '';
      const p2 = prefs[1] ? `${prefs[1].code} - ${prefs[1].title}` : '';
      const p3 = prefs[2] ? `${prefs[2].code} - ${prefs[2].title}` : '';
      const p4 = prefs[3] ? `${prefs[3].code} - ${prefs[3].title}` : '';
      const p5 = prefs[4] ? `${prefs[4].code} - ${prefs[4].title}` : '';
      
      csv += `${student.rollNumber},"${student.name}",${student.email},${student.department},${student.year},${student.semester},${student.cgpa},"${p1}","${p2}","${p3}","${p4}","${p5}"\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registered_electives_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function StudentRequestsTable({ subjects, onHandleRequest, onBulkApprove, onBulkDeny }) {
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [requestFilter, setRequestFilter] = useState('all');
    const requests = JSON.parse(localStorage.getItem('ssaems_requests')||'[]');
    const users = JSON.parse(localStorage.getItem('ssaems_users')||'[]');
    const filteredRequests = requests.filter(r => {
      if (requestFilter === 'pending') return r.status === 'pending';
      if (requestFilter === 'approved') return r.status === 'approved';
      if (requestFilter === 'denied') return r.status === 'denied';
      return true;
    });
    const getStudentDetails = (studentId) => users.find(u => u.idNumber === studentId) || { name: 'Unknown', cgpa: 'N/A' };
    const getSubjectName = (subjectId) => subjects.find(s => s.id === subjectId)?.name || subjectId;
    return (
      <div>
        <div style={{display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap'}}>
          <select value={requestFilter} onChange={e => setRequestFilter(e.target.value)}>
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
          {selectedRequests.length > 0 && (
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="btn small" onClick={() => onBulkApprove(selectedRequests)}>
                Approve Selected ({selectedRequests.length})
              </button>
              <button className="btn outline small" onClick={() => onBulkDeny(selectedRequests)}>
                Deny Selected ({selectedRequests.length})
              </button>
              <button className="btn outline small" onClick={() => setSelectedRequests([])}>
                Clear Selection
              </button>
            </div>
          )}
        </div>
        {filteredRequests.length === 0 ? (
          <p className="muted">No {requestFilter === 'all' ? '' : requestFilter} requests found.</p>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #e2e8f0', background: '#f8fafc'}}>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>
                    <input 
                      type="checkbox" 
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedRequests(filteredRequests.filter(r => r.status === 'pending').map(r => r.id));
                        } else {
                          setSelectedRequests([]);
                        }
                      }}
                    />
                  </th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Student</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>CGPA</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Current Subject</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Requested Subject</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Reason</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Status</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => {
                  const student = getStudentDetails(request.student);
                  return (
                    <tr key={request.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '12px 8px'}}>
                        {request.status === 'pending' && (
                          <input 
                            type="checkbox" 
                            checked={selectedRequests.includes(request.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedRequests([...selectedRequests, request.id]);
                              } else {
                                setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                              }
                            }}
                          />
                        )}
                      </td>
                      <td style={{padding: '12px 8px'}}>
                        <div>
                          <strong>{student.name}</strong>
                          <br />
                          <small style={{color: '#64748b'}}>{request.student}</small>
                        </div>
                      </td>
                      <td style={{padding: '12px 8px'}}>{student.cgpa}</td>
                      <td style={{padding: '12px 8px'}}>{request.current?.name || getSubjectName(request.current)}</td>
                      <td style={{padding: '12px 8px'}}>{getSubjectName(request.requested)}</td>
                      <td style={{padding: '12px 8px', maxWidth: '200px'}}>
                        <div style={{overflow: 'hidden', textOverflow: 'ellipsis'}} title={request.reason}>
                          {request.reason}
                        </div>
                      </td>
                      <td style={{padding: '12px 8px'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'white',
                          background: request.status === 'pending' ? '#f59e0b' : 
                                    request.status === 'approved' ? '#10b981' : '#ef4444'
                        }}>
                          {request.status.toUpperCase()}
                        </span>
                        {request.adminNote && (
                          <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>
                            Note: {request.adminNote}
                          </div>
                        )}
                      </td>
                      <td style={{padding: '12px 8px'}}>
                        {request.status === 'pending' && (
                          <div style={{display: 'flex', gap: '4px'}}>
                            <button 
                              className="btn small" 
                              onClick={() => {
                                const note = prompt('Add admin note (optional):');
                                onHandleRequest(request.id, 'approved', note || '');
                              }}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn outline small" 
                              onClick={() => {
                                const note = prompt('Add admin note (optional):');
                                onHandleRequest(request.id, 'denied', note || '');
                              }}
                            >
                              Deny
                            </button>
                          </div>
                        )}
                        {request.status !== 'pending' && request.resolvedAt && (
                          <div style={{fontSize: '12px', color: '#64748b'}}>
                            {new Date(request.resolvedAt).toLocaleDateString()}
                            <br />by {request.resolvedBy}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function FacultyActionsTable({ subjects, onHandleRequest }) {
    const requests = JSON.parse(localStorage.getItem('ssaems_requests')||'[]');
    const users = JSON.parse(localStorage.getItem('ssaems_users')||'[]');
    const facultyProcessedRequests = requests.filter(r => 
      r.status !== 'pending' && (!r.resolvedBy || r.resolvedBy !== 'Admin')
    );
    const getStudentDetails = (studentId) => users.find(u => u.idNumber === studentId) || { name: 'Unknown' };
    const getSubjectName = (subjectId) => subjects.find(s => s.id === subjectId)?.name || subjectId;
    return (
      <div>
        {facultyProcessedRequests.length === 0 ? (
          <p className="muted">No faculty actions recorded yet.</p>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #e2e8f0', background: '#f8fafc'}}>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Date</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Student</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Request</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Faculty Action</th>
                  <th style={{padding: '12px 8px', textAlign: 'left'}}>Admin Override</th>
                </tr>
              </thead>
              <tbody>
                {facultyProcessedRequests.map(request => {
                  const student = getStudentDetails(request.student);
                  return (
                    <tr key={request.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '12px 8px'}}>
                        {request.resolvedAt ? new Date(request.resolvedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{padding: '12px 8px'}}>{student.name}</td>
                      <td style={{padding: '12px 8px'}}>
                        {getSubjectName(request.current)} → {getSubjectName(request.requested)}
                      </td>
                      <td style={{padding: '12px 8px'}}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'white',
                          background: request.status === 'approved' ? '#10b981' : '#ef4444'
                        }}>
                          {request.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{padding: '12px 8px'}}>
                        <div style={{display: 'flex', gap: '4px'}}>
                          <button 
                            className="btn small" 
                            onClick={() => {
                              const note = prompt('Add admin override note:');
                              onHandleRequest(request.id, 'approved', `Admin Override: ${note || 'No note'}`);
                            }}
                            disabled={request.status === 'approved'}
                          >
                            Override Approve
                          </button>
                          <button 
                            className="btn outline small" 
                            onClick={() => {
                              const note = prompt('Add admin override note:');
                              onHandleRequest(request.id, 'denied', `Admin Override: ${note || 'No note'}`);
                            }}
                            disabled={request.status === 'denied'}
                          >
                            Override Deny
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function RequestAnalytics() {
    const requests = JSON.parse(localStorage.getItem('ssaems_requests')||'[]');
    const analytics = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      denied: requests.filter(r => r.status === 'denied').length,
      approvalRate: requests.length > 0 ? ((requests.filter(r => r.status === 'approved').length) / requests.length * 100).toFixed(1) : 0
    };
    const subjectRequests = {};
    requests.forEach(r => {
      const subjectName = subjects.find(s => s.id === r.requested)?.name || r.requested;
      subjectRequests[subjectName] = (subjectRequests[subjectName] || 0) + 1;
    });
    const topRequestedSubjects = Object.entries(subjectRequests)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    return (
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
        <div style={{padding: '16px', background: '#f8fafc', borderRadius: '8px'}}>
          <h6>Request Statistics</h6>
          <p><strong>Total Requests:</strong> {analytics.total}</p>
          <p><strong>Pending:</strong> {analytics.pending}</p>
          <p><strong>Approved:</strong> {analytics.approved}</p>
          <p><strong>Denied:</strong> {analytics.denied}</p>
          <p><strong>Approval Rate:</strong> {analytics.approvalRate}%</p>
        </div>
        <div style={{padding: '16px', background: '#f8fafc', borderRadius: '8px'}}>
          <h6>Most Requested Subjects</h6>
          {topRequestedSubjects.length === 0 ? (
            <p className="muted">No request data available</p>
          ) : (
            <div>
              {topRequestedSubjects.map(([subject, count], i) => (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                  <span>{subject}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{padding: '16px', background: '#f8fafc', borderRadius: '8px'}}>
          <h6>Request Trends</h6>
          <div style={{maxWidth: 200}}>
            <Doughnut 
              data={{
                labels: ['Pending', 'Approved', 'Denied'],
                datasets: [{
                  data: [analytics.pending, analytics.approved, analytics.denied],
                  backgroundColor: ['#f59e0b', '#10b981', '#ef4444']
                }]
              }}
              options={{
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AdminHeader />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Hero Section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive management of the Smart Subject Allocation System
          </Typography>
        </Box>

        {/* Tab Navigation */}
        <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 64,
              },
              '& .Mui-selected': {
                color: '#2563eb',
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
              },
            }}
          >
            <Tab icon={<AssessmentIcon />} iconPosition="start" label="Overview & Analytics" value="overview" />
            <Tab icon={<SchoolIcon />} iconPosition="start" label="Subject Management" value="subjects" />
            <Tab icon={<DescriptionIcon />} iconPosition="start" label="Registered Electives" value="registered" />
            <Tab icon={<PlayArrowIcon />} iconPosition="start" label="Allocation Control" value="allocation" />
            <Tab icon={<PersonIcon />} iconPosition="start" label="Request Management" value="requests" />
            <Tab icon={<AssessmentIcon />} iconPosition="start" label="Reports & History" value="reports" />
            <Tab icon={<SettingsIcon />} iconPosition="start" label="System Settings" value="settings" />
          </Tabs>
          <Box sx={{ px: 2, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={backfillSubjectCodes}
                startIcon={<RefreshIcon />}
              >
                Backfill Codes
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                color="error"
                onClick={clearAllSubjects}
                startIcon={<DeleteIcon />}
              >
                Clear All Subjects
              </Button>
            </Box>
          </Box>
        </Paper>
        {activeTab === 'overview' && (
          <Box>
            {/* Stat Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  height: '100%'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                      <Box sx={{ ml: 'auto' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                          {dashboardStats.totalStudents}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Total Students
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Registered in system
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  height: '100%'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SchoolIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                      <Box sx={{ ml: 'auto' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                          {subjects.length}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Total Subjects
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Available electives
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  height: '100%'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                      <Box sx={{ ml: 'auto' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                          {dashboardStats.totalAllocated}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Allocated
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Students assigned subjects
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  height: '100%'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AssessmentIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                      <Box sx={{ ml: 'auto' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                          {dashboardStats.pendingRequests}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Pending Requests
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Awaiting approval
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Charts Section */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Course Enrollment Distribution
                    </Typography>
                    <Box sx={{ maxWidth: 400, margin: '0 auto' }}>
                      <Pie data={{ 
                        labels: stats.labels, 
                        datasets: [{ 
                          data: stats.data, 
                          backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40','#C9CBCF','#8A2BE2','#00CED1','#FFD700'] 
                        }] 
                      }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Enrollments by Subject
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar 
                        data={{
                          labels: stats.labels,
                          datasets: [{
                            label: 'Students',
                            data: stats.data,
                            backgroundColor: 'rgba(37,99,235,0.6)'
                          }]
                        }}
                        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { autoSkip: false } }, y: { beginAtZero: true } } }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Allocation History
                    </Typography>
                    {allocationHistory.length === 0 ? (
                      <Typography color="text.secondary">No allocation history available</Typography>
                    ) : (
                      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {allocationHistory.slice(-5).reverse().map((entry, i) => (
                          <Paper key={i} elevation={1} sx={{ p: 2, mb: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary">Date</Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {new Date(entry.date).toLocaleDateString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary">Allocation Rate</Typography>
                                <Typography variant="body1" fontWeight={600}>
                                  {entry.allocatedPercentage}% ({entry.allocated}/{entry.totalStudents})
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary">Unallocated</Typography>
                                <Typography variant="body1" fontWeight={600} color="error">
                                  {entry.unallocated}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        {activeTab === 'subjects' && (
          <div>
            <div className="card">
              <h4>Add New Subject</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
                <input placeholder="Subject Name" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} />
                <input type="number" placeholder="Credits" value={newSubject.credits} onChange={e => setNewSubject({...newSubject, credits: parseInt(e.target.value)})} />
                <input type="number" placeholder="Hours/Week" value={newSubject.hours} onChange={e => setNewSubject({...newSubject, hours: parseInt(e.target.value)})} />
                <input type="number" placeholder="Capacity" value={newSubject.capacity} onChange={e => setNewSubject({...newSubject, capacity: parseInt(e.target.value)})} />
                <input placeholder="Faculty" value={newSubject.faculty} onChange={e => setNewSubject({...newSubject, faculty: e.target.value})} />
                
                <select value={newSubject.year} onChange={e => setNewSubject({...newSubject, year: e.target.value})} style={{padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0'}}>
                  <option value="">Select Year *</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                
                <select value={newSubject.semester} onChange={e => setNewSubject({...newSubject, semester: e.target.value})} style={{padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0'}}>
                  <option value="">Select Semester *</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
              <textarea placeholder="Description" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} style={{width: '100%', marginTop: '16px'}} />
              <input placeholder="Topics (comma-separated)" value={newSubject.topics} onChange={e => setNewSubject({...newSubject, topics: e.target.value})} style={{width: '100%', marginTop: '8px'}} />
              <button className="btn" onClick={addSubject} style={{marginTop: '16px'}}>Add Subject</button>
              
            </div>
            <div className="card">
              <h4>Existing Subjects</h4>
              <div style={{display: 'grid', gap: '16px'}}>
                {subjects.map(subject => (
                  <div key={subject.id} style={{border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                      <div>
                        <h5>{subject.name}</h5>
                        <p><strong>Code:</strong> {subject.code} | <strong>Credits:</strong> {subject.credits} | <strong>Hours:</strong> {subject.hours} | <strong>Capacity:</strong> {subject.capacity}</p>
                        <p><strong>Faculty:</strong> {subject.faculty}</p>
                        <p><strong>Year:</strong> {subject.year ? `${subject.year}${subject.year === '1' ? 'st' : subject.year === '2' ? 'nd' : subject.year === '3' ? 'rd' : 'th'} Year` : 'Not specified'} | <strong>Semester:</strong> {subject.semester ? `Semester ${subject.semester}` : 'Not specified'}</p>
                        <p><strong>Description:</strong> {subject.description}</p>
                        <p><strong>Topics:</strong> {Array.isArray(subject.topics) ? subject.topics.join(', ') : subject.topics}</p>
                      </div>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <Button size="small" variant="contained" startIcon={<EditIcon />} onClick={() => editSubject(subject)}>Edit</Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => deleteSubject(subject.id)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {editingSubject && (
              <div className="modal" style={{position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', zIndex: 1000}}>
                <h4>Edit Subject</h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
                  <input placeholder="Subject Name" value={editingSubject.name} onChange={e => setEditingSubject({...editingSubject, name: e.target.value})} />
                  <input type="number" placeholder="Credits" value={editingSubject.credits} onChange={e => setEditingSubject({...editingSubject, credits: parseInt(e.target.value)})} />
                  <input type="number" placeholder="Hours/Week" value={editingSubject.hours} onChange={e => setEditingSubject({...editingSubject, hours: parseInt(e.target.value)})} />
                  <input type="number" placeholder="Capacity" value={editingSubject.capacity} onChange={e => setEditingSubject({...editingSubject, capacity: parseInt(e.target.value)})} />
                  <input placeholder="Faculty" value={editingSubject.faculty} onChange={e => setEditingSubject({...editingSubject, faculty: e.target.value})} />
                  <select 
                    value={editingSubject.year || ''} 
                    onChange={e => setEditingSubject({...editingSubject, year: e.target.value})}
                    style={{padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px'}}
                  >
                    <option value="">Select Year *</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                  <select 
                    value={editingSubject.semester || ''} 
                    onChange={e => setEditingSubject({...editingSubject, semester: e.target.value})}
                    style={{padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px'}}
                  >
                    <option value="">Select Semester *</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
                <textarea placeholder="Description" value={editingSubject.description || ''} onChange={e => setEditingSubject({...editingSubject, description: e.target.value})} style={{width: '100%', marginTop: '16px'}} />
                <input placeholder="Topics (comma-separated)" value={Array.isArray(editingSubject.topics) ? editingSubject.topics.join(', ') : editingSubject.topics || ''} onChange={e => setEditingSubject({...editingSubject, topics: e.target.value})} style={{width: '100%', marginTop: '8px'}} />
                <div style={{marginTop: '16px', display: 'flex', gap: '8px'}}>
                  <button className="btn" onClick={updateSubject}>Update Subject</button>
                  <button className="btn outline" onClick={() => setEditingSubject(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'registered' && (
          <div>
            <div className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h4>Registered Electives</h4>
                <div style={{display: 'flex', gap: '8px'}}>
                  <Button variant="contained" startIcon={<RefreshIcon />} onClick={fetchRegisteredElectives}>
                    Refresh
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<GetAppIcon />}
                    onClick={downloadRegisteredElectivesExcel}
                    sx={{ 
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      '&:hover': { background: 'linear-gradient(135deg, #15803d, #166534)' }
                    }}
                  >
                    Download Excel
                  </Button>
                </div>
              </div>
              
              {registeredStudents.length === 0 ? (
                <p style={{color: '#666', textAlign: 'center', padding: '24px'}}>No students have registered their preferences yet.</p>
              ) : (
                <div>
                  <p style={{color: '#666', marginBottom: '16px'}}>
                    Total Registrations: <strong>{registeredStudents.length}</strong> students
                    {registeredStudents.length > 0 && (
                      <span style={{marginLeft: '16px'}}>
                        | Locked: <strong>{registeredStudents.filter(s => s.preferencesLocked).length}</strong>
                      </span>
                    )}
                  </p>
                  <div style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '14px'}}>
                      <thead>
                        <tr style={{borderBottom: '2px solid #e2e8f0', background: '#f8fafc'}}>
                          <th style={{padding: '12px 8px', textAlign: 'left'}}>Roll No</th>
                          <th style={{padding: '12px 8px', textAlign: 'left'}}>Name</th>
                          <th style={{padding: '12px 8px', textAlign: 'left'}}>Email</th>
                          <th style={{padding: '12px 8px', textAlign: 'left'}}>Year/Sem</th>
                          <th style={{padding: '12px 8px', textAlign: 'left'}}>CGPA</th>
                          <th style={{padding: '12px 8px', textAlign: 'left'}}>Status</th>
                          <th style={{padding: '12px 8px', textAlign: 'left'}}>Preferences</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredStudents.map(student => (
                          <tr key={student.studentId} style={{borderBottom: '1px solid #e2e8f0', background: student.preferencesLocked ? '#f0fdf4' : 'transparent'}}>
                            <td style={{padding: '12px 8px'}}>{student.rollNumber}</td>
                            <td style={{padding: '12px 8px'}}>{student.name}</td>
                            <td style={{padding: '12px 8px', fontSize: '12px', color: '#64748b'}}>{student.email}</td>
                            <td style={{padding: '12px 8px'}}>Y{student.year}/S{student.semester}</td>
                            <td style={{padding: '12px 8px'}}>{student.cgpa}</td>
                            <td style={{padding: '12px 8px'}}>
                              {student.preferencesLocked ? (
                                <span style={{color: '#16a34a', fontSize: '12px', fontWeight: 'bold'}}>
                                  🔒 Locked
                                </span>
                              ) : (
                                <span style={{color: '#f59e0b', fontSize: '12px'}}>
                                  Draft
                                </span>
                              )}
                              {student.submittedAt && (
                                <div style={{fontSize: '10px', color: '#64748b', marginTop: '2px'}}>
                                  {new Date(student.submittedAt).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td style={{padding: '12px 8px'}}>
                              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                {(student.preferences || []).map((pref, idx) => (
                                  <div key={idx} style={{fontSize: '12px'}}>
                                    <span style={{fontWeight: 'bold', color: '#1976d2'}}>#{pref.priority}</span>
                                    {' '}
                                    <span style={{color: '#334155'}}>{pref.code} - {pref.title}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'allocation' && (
          <Box>
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon sx={{ fontSize: 32, mr: 1.5, color: '#2563eb' }} />
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    CGPA-Based Subject Allocation
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Run the automated allocation algorithm to assign subjects to students based on their registered electives and CGPA.
                  Higher CGPA students get priority for their preferred choices. This uses preferences already submitted by students—no CSV upload required.
                </Typography>

                {/* Main Allocation Buttons */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                  <Button 
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrowIcon />}
                    onClick={runUnifiedAllocation} 
                    disabled={systemSettings.allocationLocked || runningAllocation}
                    sx={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                      },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    {runningAllocation ? 'Running Allocation...' : 
                     systemSettings.allocationLocked ? 'Allocation Locked' : 
                     'Run Allocation Algorithm'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<DeleteIcon />}
                    onClick={clearAllAllocations}
                  >
                    Clear All Allocations
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<GetAppIcon />}
                    onClick={exportCSV}
                  >
                    Export CSV
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<AssessmentIcon />}
                    onClick={generateReports}
                  >
                    Generate Report
                  </Button>
                </Box>

                {systemSettings.allocationLocked && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#fee2e2', 
                    borderRadius: 2, 
                    border: '1px solid #fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <LockIcon sx={{ color: '#dc2626' }} />
                    <Typography variant="body2" color="error">
                      Allocation is currently locked. Go to System Settings to unlock.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Faculty Allocation Section */}
            <Card elevation={2} sx={{ 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #fbbf24'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ fontSize: 32, mr: 1.5, color: '#d97706' }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#92400e' }}>
                      Faculty Allocation
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#78350f' }}>
                      Based on Experience
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mb: 3, color: '#78350f' }}>
                  Allocate faculty to sections based on experience. Most experienced faculty get top sections (A → B → C).
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                  <Button 
                    variant="contained"
                    size="large"
                    startIcon={<PersonIcon />}
                    onClick={runFacultyAllocation}
                    disabled={runningFacultyAllocation}
                    sx={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #d97706, #b45309)',
                      },
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    {runningFacultyAllocation ? 'Allocating Faculty...' : 'Allocate Faculty'}
                  </Button>
                  <Button 
                    variant="outlined"
                    startIcon={<GetAppIcon />}
                    onClick={exportFacultyCSV}
                    sx={{
                      borderColor: '#fbbf24',
                      color: '#d97706',
                      '&:hover': {
                        borderColor: '#f59e0b',
                        bgcolor: 'rgba(245, 158, 11, 0.04)',
                      }
                    }}
                  >
                    Export Faculty CSV
                  </Button>
                </Box>
                
                {facultyAllocationResults && (
                  <Paper elevation={1} sx={{ p: 3, bgcolor: '#fff', border: '1px solid #fbbf24' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircleIcon sx={{ color: '#16a34a', mr: 1 }} />
                      <Typography variant="h6" sx={{ color: '#92400e', fontWeight: 600 }}>
                        Faculty Allocation Results
                      </Typography>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Allocated Sections</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#92400e' }}>
                          {facultyAllocationResults.allocatedSections}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Unallocated Sections</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626' }}>
                          {facultyAllocationResults.unallocatedSections}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Success Rate</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#16a34a' }}>
                          {facultyAllocationResults.statistics.successRate}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Faculty Utilized</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2563eb' }}>
                          {facultyAllocationResults.statistics.facultyUtilized}/{facultyAllocationResults.statistics.totalFaculty}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </CardContent>
            </Card>

            {/* Allocation Results Modal */}
            {showAllocationModal && allocationResults && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '32px',
                  maxWidth: '700px',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                  <h2 style={{marginTop: 0, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    ✅ Allocation Complete!
                  </h2>

                  {/* Statistics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div style={{padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe'}}>
                      <div style={{fontSize: '13px', color: '#1e40af', marginBottom: '4px'}}>Total Students</div>
                      <div style={{fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a'}}>
                        {allocationResults.statistics.totalStudents}
                      </div>
                    </div>
                    <div style={{padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac'}}>
                      <div style={{fontSize: '13px', color: '#15803d', marginBottom: '4px'}}>Successfully Allocated</div>
                      <div style={{fontSize: '28px', fontWeight: 'bold', color: '#166534'}}>
                        {allocationResults.statistics.allocated}
                      </div>
                    </div>
                    <div style={{padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5'}}>
                      <div style={{fontSize: '13px', color: '#b91c1c', marginBottom: '4px'}}>Unallocated</div>
                      <div style={{fontSize: '28px', fontWeight: 'bold', color: '#991b1b'}}>
                        {allocationResults.statistics.unallocated}
                      </div>
                    </div>
                    <div style={{padding: '16px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fde047'}}>
                      <div style={{fontSize: '13px', color: '#a16207', marginBottom: '4px'}}>Success Rate</div>
                      <div style={{fontSize: '28px', fontWeight: 'bold', color: '#854d0e'}}>
                        {allocationResults.statistics.allocationPercentage}%
                      </div>
                    </div>
                  </div>

                  {/* Subject-wise Allocation */}
                  {allocationResults.subjectStats && allocationResults.subjectStats.length > 0 && (
                    <div style={{marginBottom: '24px'}}>
                      <h3 style={{fontSize: '16px', marginBottom: '12px', color: '#334155'}}>
                        📘 Subject-wise Allocation
                      </h3>
                      <div style={{
                        maxHeight: '200px',
                        overflow: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}>
                        <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse'}}>
                          <thead style={{background: '#f8fafc', position: 'sticky', top: 0}}>
                            <tr>
                              <th style={{padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0'}}>Subject</th>
                              <th style={{padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0'}}>Students</th>
                              <th style={{padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0'}}>Sections</th>
                              <th style={{padding: '10px', textAlign: 'center', borderBottom: '1px solid #e2e8f0'}}>CGPA Cutoff</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allocationResults.subjectStats.map((stat, idx) => (
                              <tr key={idx} style={{borderBottom: '1px solid #f1f5f9'}}>
                                <td style={{padding: '10px'}}>
                                  <div style={{fontWeight: 'bold', color: '#1e293b'}}>{stat.subjectCode}</div>
                                  <div style={{fontSize: '11px', color: '#64748b'}}>{stat.subjectTitle}</div>
                                </td>
                                <td style={{padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#1976d2'}}>
                                  {stat.totalAllocated}
                                </td>
                                <td style={{padding: '10px', textAlign: 'center', fontSize: '12px'}}>
                                  {Object.entries(stat.sections).map(([sec, count]) => (
                                    <span key={sec} style={{
                                      display: 'inline-block',
                                      margin: '2px',
                                      padding: '2px 6px',
                                      background: '#e0f2fe',
                                      borderRadius: '4px',
                                      color: '#0369a1'
                                    }}>
                                      {sec}({count})
                                    </span>
                                  ))}
                                </td>
                                <td style={{padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#059669'}}>
                                  {stat.cgpaCutoff ? stat.cgpaCutoff.toFixed(2) : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Unallocated Students */}
                  {((allocationResults.unallocatedStudents && allocationResults.unallocatedStudents.length > 0) || 
                    (allocationResults.unallocatedList && allocationResults.unallocatedList.length > 0)) && (
                    <div style={{marginBottom: '24px'}}>
                      <h3 style={{fontSize: '16px', marginBottom: '12px', color: '#dc2626'}}>
                        ⚠️ Unallocated Students ({(allocationResults.unallocatedList || allocationResults.unallocatedStudents).length})
                      </h3>
                      <div style={{
                        maxHeight: '200px',
                        overflow: 'auto',
                        background: '#fef2f2',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #fca5a5'
                      }}>
                        {(allocationResults.unallocatedList || allocationResults.unallocatedStudents).slice(0, 10).map((student, idx) => (
                          <div key={idx} style={{
                            fontSize: '13px', 
                            padding: '8px', 
                            marginBottom: '6px',
                            background: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #fecaca'
                          }}>
                            <div style={{fontWeight: '600', color: '#991b1b'}}>
                              {student.rollNumber || 'N/A'} - {student.name || 'Unknown'}
                            </div>
                            <div style={{fontSize: '12px', color: '#7f1d1d', marginTop: '2px'}}>
                              📧 {student.email} | 📊 CGPA: {student.cgpa || 'N/A'}
                            </div>
                            {student.preferences && (
                              <div style={{fontSize: '11px', color: '#991b1b', marginTop: '4px'}}>
                                Preferences: {student.preferences}
                              </div>
                            )}
                            {student.department && (
                              <div style={{fontSize: '11px', color: '#7f1d1d'}}>
                                {student.department} | Year {student.year} | Sem {student.semester}
                              </div>
                            )}
                          </div>
                        ))}
                        {(allocationResults.unallocatedList || allocationResults.unallocatedStudents).length > 10 && (
                          <div style={{fontSize: '12px', color: '#7f1d1d', marginTop: '8px', textAlign: 'center'}}>
                            ... and {(allocationResults.unallocatedList || allocationResults.unallocatedStudents).length - 10} more unallocated students
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <div style={{textAlign: 'center', marginTop: '24px'}}>
                    <Button 
                      variant="contained"
                      size="large"
                      onClick={() => setShowAllocationModal(false)}
                      sx={{ px: 4, py: 1.5 }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Allocation Preview */}
            <div className="card">
              <h4>Allocation Preview</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
                {subjects.map(subject => {
                  const allocated = Object.values(JSON.parse(localStorage.getItem('ssaems_allotments')||'{}')).filter(a => a.id === subject.id).length;
                  const utilization = ((allocated / subject.capacity) * 100).toFixed(1);
                  return (
                    <div key={subject.id} style={{border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px'}}>
                      <h6>{subject.name}</h6>
                      <p><strong>Capacity:</strong> {subject.capacity}</p>
                      <p><strong>Allocated:</strong> {allocated}</p>
                      <p><strong>Available:</strong> {subject.capacity - allocated}</p>
                      <p><strong>Utilization:</strong> {utilization}%</p>
                      <div style={{background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden'}}>
                        <div style={{background: Number(utilization) > 90 ? '#ef4444' : Number(utilization) > 70 ? '#f59e0b' : '#10b981', width: `${Math.min(Number(utilization), 100)}%`, height: '100%'}}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Box>
        )}

        {activeTab === 'requests' && (
          <div>
            <div className="card">
              <h4>Student Change Requests</h4>
              <StudentRequestsTable 
                subjects={subjects}
                onHandleRequest={handleRequest}
                onBulkApprove={bulkApproveRequests}
                onBulkDeny={bulkDenyRequests}
              />
            </div>
            <div className="card">
              <h4>Faculty Actions & Updates</h4>
              <FacultyActionsTable 
                subjects={subjects}
                onHandleRequest={handleRequest}
              />
            </div>
            <div className="card">
              <h4>Request Analytics</h4>
              <RequestAnalytics />
            </div>
          </div>
        )}
        {activeTab === 'reports' && (
          <Box>
            <Card elevation={2} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  System Reports
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="contained" startIcon={<AssessmentIcon />} onClick={generateReports}>
                    Generate Summary Report
                  </Button>
                  <Button variant="outlined" startIcon={<GetAppIcon />} onClick={exportCSV}>
                    Export Student Data
                  </Button>
                </Box>
              </CardContent>
            </Card>
            
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Allocation History
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    startIcon={<RefreshIcon />}
                    onClick={loadAllocationHistory}
                  >
                    Refresh
                  </Button>
                </Box>
                
                {allocationHistory.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No allocation history available
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Total Students</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Allocated</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Unallocated</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Success Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allocationHistory.map((entry, i) => (
                          <TableRow key={i} hover>
                            <TableCell>
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>{entry.totalStudents}</TableCell>
                            <TableCell>
                              <Chip 
                                label={entry.allocated} 
                                size="small" 
                                color="success"
                                sx={{ minWidth: 50 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={entry.unallocated} 
                                size="small" 
                                color={entry.unallocated > 0 ? "error" : "default"}
                                sx={{ minWidth: 50 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {entry.allocatedPercentage}%
                                </Typography>
                                <Box 
                                  sx={{ 
                                    flexGrow: 1,
                                    height: 8,
                                    bgcolor: '#e2e8f0',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    minWidth: 100
                                  }}
                                >
                                  <Box
                                    sx={{
                                      height: '100%',
                                      width: `${entry.allocatedPercentage}%`,
                                      bgcolor: parseFloat(entry.allocatedPercentage) >= 90 
                                        ? '#16a34a' 
                                        : parseFloat(entry.allocatedPercentage) >= 70 
                                        ? '#f59e0b' 
                                        : '#ef4444',
                                      transition: 'width 0.3s ease'
                                    }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
        {activeTab === 'settings' && (
          <div>
            <div className="card">
              <h4>System Settings</h4>
              <div style={{display: 'grid', gap: '16px', maxWidth: '400px'}}>
                <label>
                  Semester
                  <input value={systemSettings.semester} onChange={e => setSystemSettings({...systemSettings, semester: e.target.value})} />
                </label>
                <label>
                  Maximum Preferences per Student
                  <input type="number" min="1" max="10" value={systemSettings.maxPreferences} onChange={e => setSystemSettings({...systemSettings, maxPreferences: parseInt(e.target.value)})} />
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <input type="checkbox" checked={systemSettings.registrationOpen} onChange={e => setSystemSettings({...systemSettings, registrationOpen: e.target.checked})} />
                  Registration Open
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <input type="checkbox" checked={systemSettings.allocationLocked} onChange={e => setSystemSettings({...systemSettings, allocationLocked: e.target.checked})} />
                  Lock Allocation (Prevents new allocations)
                </label>
                <Button variant="contained" startIcon={<SettingsIcon />} onClick={saveSystemSettings}>Save Settings</Button>
              </div>
            </div>
            <div className="card">
              <h4>System Information</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
                <div>
                  <h6>Database Status</h6>
                  <p style={{color: '#10b981'}}>✅ Connected (LocalStorage)</p>
                </div>
                <div>
                  <h6>Last Allocation</h6>
                  <p>{allocationHistory.length > 0 ? new Date(allocationHistory[allocationHistory.length - 1].date).toLocaleDateString() : 'Never'}</p>
                </div>
                <div>
                  <h6>System Version</h6>
                  <p>SSAEMS v1.0.0</p>
                </div>
                <div>
                  <h6>Total Users</h6>
                  <p>{JSON.parse(localStorage.getItem('ssaems_users')||'[]').length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>

      {/* Old upload dialog removed - now using MongoDB-backed allocation via runUnifiedAllocation() */}
    </Box>
  );
}
