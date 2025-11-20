import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  LinearProgress,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterAltIcon,
  Download as DownloadIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  ViewList as ViewListIcon,
  Dashboard as DashboardIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const FacultyDashboard = () => {
  const navigate = useNavigate();

  // Header style for consistency across dashboards
  const headerStyle = {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  // Dynamic faculty state (will fetch real subjects/information later)
  const [faculty, setFaculty] = React.useState({
    name: 'Loading...',
    designation: '',
    experience: 0,
    coursesTaught: 0,
    studentsAllocated: 0,
    courseIds: [],
    employeeId: '',
    department: '',
    specialization: [],
  });
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [loadingRequests, setLoadingRequests] = React.useState(true);
  const [loadingAllocations, setLoadingAllocations] = React.useState(true);
  const [loadingSections, setLoadingSections] = React.useState(true);
  const [error, setError] = React.useState('');

  const [allottedStudents, setAllottedStudents] = React.useState([]);
  const [sectionAllocations, setSectionAllocations] = React.useState([]);
  const [requests, setRequests] = React.useState([]);
  const [studentQuery, setStudentQuery] = React.useState('');
  const [studentPage, setStudentPage] = React.useState(1);
  const pageSize = 8;
  const [courseFilter, setCourseFilter] = React.useState('all');
  const [sectionFilter, setSectionFilter] = React.useState('all');
  const [sortKey, setSortKey] = React.useState('name'); // 'name' | 'regd' | 'course' | 'cgpa'
  const [sortDir, setSortDir] = React.useState('asc'); // 'asc' | 'desc'
  const [reqOpen, setReqOpen] = React.useState(false);
  const [reqIndex, setReqIndex] = React.useState(null);
  const [studentDetailOpen, setStudentDetailOpen] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState(0); // 0: Overview, 1: Sections, 2: Students, 3: Requests
  const [autoRefresh, setAutoRefresh] = React.useState(false);

  // Fetch faculty profile
  const fetchFacultyProfile = React.useCallback(async () => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/faculty/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to load faculty profile');
      const data = await resp.json();
      const facultyData = data.faculty || {};
      
      setFaculty((prev) => ({
        ...prev,
        name: facultyData.name || 'Faculty',
        designation: facultyData.designation || 'Faculty',
        experience: facultyData.experience || 0,
        employeeId: facultyData.employeeId || '',
        department: facultyData.department || '',
        specialization: facultyData.specialization || [],
        courseIds: facultyData.specialization || [],
        coursesTaught: (facultyData.specialization || []).length,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const fetchChangeRequests = React.useCallback(async () => {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/faculty/change-requests?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to load change requests');
      const data = await resp.json();
      const mapped = (data.requests || []).map(r => ({
        id: r._id,
        userId: r.student?.rollNumber || 'Unknown',
        wantsChange: 'yes',
        reason: r.reason || '',
        newCourse: r.requestedSubject?.code || r.requestedSubject?.title || 'Unknown',
        currentCourse: r.currentSubject?.code || r.currentSubject?.title || 'Unknown',
        status: r.status === 'pending' ? null : r.status,
        createdAt: r.createdAt,
        raw: r,
      }));
      setRequests(mapped);
    } catch (e) {
      setError(e.message);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const fetchAllocations = React.useCallback(async () => {
    setLoadingAllocations(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch students assigned to this faculty's sections
      const resp = await fetch('/api/faculty/my-students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to load students');
      const data = await resp.json();
      const students = data.students || [];
      
      // Map all students with their subject and section details
      const rows = students.map(s => ({
        name: s.name || 'Unknown',
        regd: s.rollNumber || '-',
        courseId: s.subject?.code || '-',
        courseName: s.subject?.title || '-',
        section: s.section || '-',
        department: s.department || '-',
        year: s.year || '-',
        semester: s.semester || '-',
        cgpa: s.cgpa || 0,
        email: s.email || '-',
      }));
      
      setAllottedStudents(rows);
      
      // Extract unique sections for filtering
      const uniqueSections = [...new Set(rows.map(r => r.section))].filter(s => s !== '-');
      if (uniqueSections.length > 0 && !uniqueSections.includes(sectionFilter) && sectionFilter !== 'all') {
        setSectionFilter('all');
      }
    } catch (e) {
      setError(e.message);
      setAllottedStudents([]);
    } finally {
      setLoadingAllocations(false);
    }
  }, [sectionFilter]);

  // Fetch section allocations (live data)
  const fetchSectionAllocations = React.useCallback(async () => {
    setLoadingSections(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/faculty/my-allocations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to load section allocations');
      const data = await resp.json();
      const allocations = data.allocations || [];
      
      // Count students per section
      const sectionData = allocations.map(alloc => {
        const studentsInSection = allottedStudents.filter(
          s => s.courseId === alloc.subject?.code && s.section === alloc.section
        );
        
        return {
          id: alloc.id,
          subject: alloc.subject,
          section: alloc.section,
          year: alloc.year,
          semester: alloc.semester,
          studentCount: studentsInSection.length,
          avgCgpa: studentsInSection.length > 0 
            ? (studentsInSection.reduce((sum, s) => sum + (s.cgpa || 0), 0) / studentsInSection.length).toFixed(2)
            : 0,
          assignedAt: alloc.assignedAt,
        };
      });
      
      setSectionAllocations(sectionData);
      
      // Update faculty course count
      const uniqueCourses = [...new Set(allocations.map(a => a.subject?.code))].filter(Boolean);
      setFaculty(prev => ({
        ...prev,
        coursesTaught: uniqueCourses.length,
        courseIds: uniqueCourses,
      }));
    } catch (e) {
      setError(e.message);
      setSectionAllocations([]);
    } finally {
      setLoadingSections(false);
    }
  }, [allottedStudents]);

  React.useEffect(() => {
    fetchFacultyProfile();
  }, [fetchFacultyProfile]);

  React.useEffect(() => {
    fetchChangeRequests();
    fetchAllocations();
  }, [fetchChangeRequests, fetchAllocations]);

  React.useEffect(() => {
    if (allottedStudents.length > 0) {
      fetchSectionAllocations();
    }
  }, [allottedStudents, fetchSectionAllocations]);

  // Auto-refresh every 30 seconds if enabled
  React.useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchChangeRequests();
        fetchAllocations();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchChangeRequests, fetchAllocations]);

  const approveOrDeny = async (idx, action) => {
    try {
      const token = localStorage.getItem('token');
      const reqObj = requests[idx];
      if (!reqObj) return;
      const resp = await fetch('/api/faculty/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ requestId: reqObj.id, action })
      });
      if (!resp.ok) throw new Error('Failed to update request');
      await fetchChangeRequests();
    } catch (e) {
      setError(e.message);
    }
  };

  const updateRequestStatus = (idx, status) => {
    // Legacy local update replaced by approveOrDeny
    approveOrDeny(idx, status === 'approved' ? 'approve' : 'deny');
  };

  const filteredRequests = React.useMemo(() => {
    return courseFilter === 'all' ? requests : requests.filter((r) => r.newCourse === courseFilter || r.currentCourse === courseFilter);
  }, [requests, courseFilter]);

  const exportStudentsCsv = (rows) => {
    const header = ['Name', 'Regd No', 'Course ID', 'Course Name', 'Section', 'Department', 'Year', 'Semester', 'CGPA', 'Email'];
    const lines = rows.map((s) => [
      s.name, 
      s.regd, 
      s.courseId, 
      s.courseName, 
      s.section, 
      s.department, 
      s.year, 
      s.semester, 
      s.cgpa,
      s.email
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSectionCsv = (sectionCode) => {
    const filtered = allottedStudents.filter(s => s.section === sectionCode);
    const header = ['Name', 'Regd No', 'Course ID', 'Course Name', 'Section', 'Department', 'Year', 'Semester', 'CGPA', 'Email'];
    const lines = filtered.map((s) => [
      s.name, 
      s.regd, 
      s.courseId, 
      s.courseName, 
      s.section, 
      s.department, 
      s.year, 
      s.semester, 
      s.cgpa,
      s.email
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `section_${sectionCode}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefreshAll = () => {
    fetchFacultyProfile();
    fetchChangeRequests();
    fetchAllocations();
  };

  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setStudentDetailOpen(true);
  };

  // Get unique sections
  const uniqueSections = React.useMemo(() => {
    return [...new Set(allottedStudents.map(s => s.section))].filter(s => s !== '-').sort();
  }, [allottedStudents]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={headerStyle}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Faculty Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, {faculty.name} • {faculty.employeeId}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title={autoRefresh ? "Auto-refresh enabled (30s)" : "Enable auto-refresh"}>
            <Button 
              size="small" 
              variant={autoRefresh ? "contained" : "outlined"} 
              color={autoRefresh ? "success" : "inherit"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              startIcon={<RefreshIcon />}
            >
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </Button>
          </Tooltip>
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleRefreshAll}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="fullWidth">
          <Tab icon={<DashboardIcon />} label="Overview" iconPosition="start" />
          <Tab icon={<ClassIcon />} label={`Sections (${sectionAllocations.length})`} iconPosition="start" />
          <Tab icon={<PeopleIcon />} label={`Students (${allottedStudents.length})`} iconPosition="start" />
          <Tab 
            icon={
              <Badge badgeContent={filteredRequests.filter(r => !r.status).length} color="error">
                <AssignmentIcon />
              </Badge>
            } 
            label="Requests" 
            iconPosition="start" 
          />
        </Tabs>
      </Paper>

      {/* Tab 0: Overview */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Quick Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <PeopleIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{allottedStudents.length}</Typography>
                <Typography variant="body2">Total Students</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <FilterAltIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{filteredRequests.filter(r => !r.status).length}</Typography>
                <Typography variant="body2">Pending Requests</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <ClassIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{sectionAllocations.length}</Typography>
                <Typography variant="body2">Sections Assigned</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <SchoolIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{faculty.courseIds.length}</Typography>
                <Typography variant="body2">Unique Courses</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Profile Summary */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" /> Profile Summary
              </Typography>
              {loadingProfile ? (
                <Typography color="text.secondary">Loading profile...</Typography>
              ) : (
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{faculty.name}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{faculty.employeeId || 'N/A'}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Designation</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{faculty.designation || 'N/A'}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Department</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{faculty.department || 'N/A'}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Experience</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{faculty.experience} years</Typography>
                  </Box>
                  {faculty.specialization && faculty.specialization.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Specialization</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {faculty.specialization.map((spec, idx) => (
                            <Chip key={idx} label={spec} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </Box>
                      </Box>
                    </>
                  )}
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" /> Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button 
                  variant="contained" 
                  startIcon={<ClassIcon />} 
                  fullWidth
                  onClick={() => setActiveTab(1)}
                >
                  View My Sections ({sectionAllocations.length})
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<PeopleIcon />} 
                  fullWidth
                  color="secondary"
                  onClick={() => setActiveTab(2)}
                >
                  Manage Students ({allottedStudents.length})
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<AssignmentIcon />} 
                  fullWidth
                  color="warning"
                  onClick={() => setActiveTab(3)}
                >
                  Review Requests ({filteredRequests.filter(r => !r.status).length})
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<DownloadIcon />} 
                  fullWidth
                  onClick={() => exportStudentsCsv(allottedStudents)}
                >
                  Export All Students
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Recent Requests Preview */}
          {filteredRequests.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Change Requests
                  </Typography>
                  <Button size="small" onClick={() => setActiveTab(3)}>View All</Button>
                </Box>
                <List>
                  {filteredRequests.slice(0, 3).map((r, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{r.userId}</Typography>
                              <Chip size="small" label={r.status || 'Pending'} color={!r.status ? 'warning' : r.status === 'approved' ? 'success' : 'default'} />
                            </Stack>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" display="block">
                                From: <strong>{r.currentCourse}</strong> → To: <strong>{r.newCourse}</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary" display="block">
                                Reason: {r.reason || 'No reason provided'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                              </Typography>
                            </>
                          }
                        />
                        {!r.status && (
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" color="success" onClick={() => updateRequestStatus(idx, 'approved')}>
                              Approve
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => updateRequestStatus(idx, 'denied')}>
                              Deny
                            </Button>
                          </Stack>
                        )}
                      </ListItem>
                      {idx < Math.min(filteredRequests.length, 3) - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab 1: My Sections */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  My Section Allocations
                </Typography>
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={() => fetchSectionAllocations()}
                  disabled={loadingSections}
                >
                  Refresh
                </Button>
              </Box>

              {loadingSections ? (
                <Typography color="text.secondary">Loading sections...</Typography>
              ) : sectionAllocations.length === 0 ? (
                <Alert severity="info">No sections assigned yet</Alert>
              ) : (
                <Grid container spacing={2}>
                  {sectionAllocations.map((section) => (
                    <Grid item xs={12} sm={6} md={4} key={section.id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Section {section.section}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {section.subject?.code}
                              </Typography>
                            </Box>
                            <Chip 
                              label={`${section.studentCount} Students`} 
                              color="primary" 
                              size="small" 
                            />
                          </Box>
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Stack spacing={1}>
                            <Typography variant="body2">
                              <strong>Course:</strong> {section.subject?.title}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Credits:</strong> {section.subject?.credits || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Hours:</strong> {section.subject?.hours || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Year/Sem:</strong> {section.year} / {section.semester}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Avg CGPA:</strong> {section.avgCgpa}
                            </Typography>
                            {section.assignedAt && (
                              <Typography variant="caption" color="text.secondary">
                                Assigned: {new Date(section.assignedAt).toLocaleDateString()}
                              </Typography>
                            )}
                          </Stack>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            startIcon={<ViewListIcon />}
                            onClick={() => {
                              setSectionFilter(section.section);
                              setActiveTab(2);
                            }}
                          >
                            View Students
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<DownloadIcon />}
                            onClick={() => exportSectionCsv(section.section)}
                          >
                            Export
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Section-wise Statistics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Section-wise Statistics
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Section</strong></TableCell>
                      <TableCell><strong>Course</strong></TableCell>
                      <TableCell align="right"><strong>Students</strong></TableCell>
                      <TableCell align="right"><strong>Avg CGPA</strong></TableCell>
                      <TableCell align="center"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sectionAllocations.map((section) => (
                      <TableRow key={section.id} hover>
                        <TableCell>
                          <Chip label={`Section ${section.section}`} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{section.subject?.code}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {section.subject?.title}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6">{section.studentCount}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={section.avgCgpa} 
                            size="small" 
                            color={section.avgCgpa >= 7.5 ? 'success' : section.avgCgpa >= 6 ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Students">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSectionFilter(section.section);
                                setActiveTab(2);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export Section">
                            <IconButton 
                              size="small"
                              onClick={() => exportSectionCsv(section.section)}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Student Management */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Student Management</Typography>
              
              {/* Filters */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="Search students"
                  value={studentQuery}
                  onChange={(e) => { setStudentQuery(e.target.value); setStudentPage(1); }}
                  sx={{ minWidth: { xs: '100%', sm: 300 } }}
                  placeholder="Name, roll no, course, or section"
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Section</InputLabel>
                  <Select 
                    label="Section" 
                    value={sectionFilter} 
                    onChange={(e) => { setSectionFilter(e.target.value); setStudentPage(1); }}
                  >
                    <MenuItem value="all">All Sections</MenuItem>
                    {uniqueSections.map((sec) => (
                      <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select 
                    label="Sort By" 
                    value={sortKey} 
                    onChange={(e) => { setSortKey(e.target.value); setStudentPage(1); }}
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="regd">Roll Number</MenuItem>
                    <MenuItem value="course">Course</MenuItem>
                    <MenuItem value="cgpa">CGPA</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Order</InputLabel>
                  <Select 
                    label="Order" 
                    value={sortDir} 
                    onChange={(e) => { setSortDir(e.target.value); setStudentPage(1); }}
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </Select>
                </FormControl>

                <Button 
                  variant="outlined" 
                  startIcon={<DownloadIcon />}
                  onClick={() => exportStudentsCsv(allottedStudents)}
                >
                  Export All
                </Button>
              </Box>

              {/* Student Cards */}
              {allottedStudents.length === 0 ? (
                <Alert severity="info">No students assigned yet</Alert>
              ) : (
                <>
                  {(() => {
                    const q = studentQuery.trim().toLowerCase();
                    let pool = sectionFilter === 'all' ? allottedStudents : allottedStudents.filter((s) => s.section === sectionFilter);
                    
                    let filtered = q
                      ? pool.filter((s) =>
                          (s.name || '').toLowerCase().includes(q) ||
                          (s.regd || '').toLowerCase().includes(q) ||
                          (s.courseId || '').toLowerCase().includes(q) ||
                          (s.courseName || '').toLowerCase().includes(q) ||
                          (s.section || '').toLowerCase().includes(q)
                        )
                      : pool;
                    
                    // Sorting
                    filtered = [...filtered].sort((a,b)=>{
                      let av, bv;
                      if (sortKey === 'name') { 
                        av = (a.name||'').toLowerCase(); 
                        bv = (b.name||'').toLowerCase(); 
                      } else if (sortKey === 'regd') { 
                        av = (a.regd||'').toLowerCase(); 
                        bv = (b.regd||'').toLowerCase(); 
                      } else if (sortKey === 'cgpa') {
                        av = a.cgpa || 0;
                        bv = b.cgpa || 0;
                      } else { 
                        av = (a.courseName||a.courseId||'').toLowerCase(); 
                        bv = (b.courseName||b.courseId||'').toLowerCase(); 
                      }
                      if (av < bv) return sortDir === 'asc' ? -1 : 1;
                      if (av > bv) return sortDir === 'asc' ? 1 : -1;
                      return 0;
                    });
                    
                    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
                    const current = Math.min(studentPage, totalPages);
                    const start = (current - 1) * pageSize;
                    const paged = filtered.slice(start, start + pageSize);
                    
                    return (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Showing {paged.length} of {filtered.length} students
                          {sectionFilter !== 'all' && ` in Section ${sectionFilter}`}
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {paged.map((s, idx) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={`${s.regd}-${s.section}-${idx}`}>
                              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                      {s.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                        {s.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {s.regd}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  
                                  <Divider sx={{ my: 1 }} />
                                  
                                  <Stack spacing={0.5}>
                                    <Typography variant="body2">
                                      <strong>{s.courseId}</strong>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      {s.courseName}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Section:</strong> {s.section}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                      {s.department} • Y{s.year} • S{s.semester}
                                    </Typography>
                                  </Stack>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                  <Chip 
                                    size="small" 
                                    label={`CGPA: ${s.cgpa}`} 
                                    color={s.cgpa >= 7.5 ? 'success' : s.cgpa >= 6 ? 'warning' : 'default'}
                                  />
                                  <Tooltip title="View Details">
                                    <IconButton size="small" onClick={() => viewStudentDetails(s)}>
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </CardActions>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                          <Button 
                            size="small" 
                            disabled={current <= 1} 
                            onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                          >
                            Previous
                          </Button>
                          <Typography variant="body2">
                            Page {current} of {totalPages}
                          </Typography>
                          <Button 
                            size="small" 
                            disabled={current >= totalPages} 
                            onClick={() => setStudentPage((p) => Math.min(totalPages, p + 1))}
                          >
                            Next
                          </Button>
                        </Box>
                      </>
                    );
                  })()}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 3: Change Requests */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Student Change Requests
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label={`${filteredRequests.filter(r => !r.status).length} Pending`} 
                    color="warning" 
                  />
                  <Button 
                    startIcon={<RefreshIcon />} 
                    onClick={fetchChangeRequests}
                    disabled={loadingRequests}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Box>

              {loadingRequests ? (
                <Typography color="text.secondary">Loading requests...</Typography>
              ) : filteredRequests.length === 0 ? (
                <Alert severity="info">No change requests found</Alert>
              ) : (
                <List>
                  {filteredRequests.map((r, idx) => (
                    <React.Fragment key={`${r.userId || idx}-${r.createdAt || idx}`}>
                      <ListItem alignItems="flex-start" sx={{ px: 0, py: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                              {r.userId.charAt(0)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {r.userId || 'Unknown Student'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                              </Typography>
                            </Box>
                            {r.status && (
                              <Chip 
                                size="small" 
                                label={r.status} 
                                color={r.status === 'approved' ? 'success' : 'default'} 
                              />
                            )}
                            {!r.status && (
                              <Chip size="small" label="Pending" color="warning" />
                            )}
                          </Stack>
                          
                          <Box sx={{ ml: 6, mt: 1 }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Change Request:</strong> {r.currentCourse} → {r.newCourse}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Reason:</strong> {r.reason || 'No reason provided'}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {!r.status && !loadingRequests && (
                          <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success" 
                              onClick={() => updateRequestStatus(idx, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => updateRequestStatus(idx, 'denied')}
                            >
                              Deny
                            </Button>
                          </Stack>
                        )}
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Student Detail Dialog */}
      <Dialog 
        open={studentDetailOpen} 
        onClose={() => setStudentDetailOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Student Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="h6">{selectedStudent.name}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">Roll Number</Typography>
                <Typography variant="body1">{selectedStudent.regd}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">
                  <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {selectedStudent.email}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">Course Allocation</Typography>
                <Typography variant="body1">
                  <strong>{selectedStudent.courseId}</strong> - {selectedStudent.courseName}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Section: <strong>{selectedStudent.section}</strong>
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">Academic Details</Typography>
                <Typography variant="body1">
                  Department: <strong>{selectedStudent.department}</strong>
                </Typography>
                <Typography variant="body1">
                  Year: <strong>{selectedStudent.year}</strong> | Semester: <strong>{selectedStudent.semester}</strong>
                </Typography>
                <Typography variant="body1">
                  CGPA: <Chip 
                    size="small" 
                    label={selectedStudent.cgpa} 
                    color={selectedStudent.cgpa >= 7.5 ? 'success' : selectedStudent.cgpa >= 6 ? 'warning' : 'default'}
                  />
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Request Details Modal (legacy) */}
      <Dialog open={reqOpen} onClose={() => setReqOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent dividers>
          {reqIndex != null && filteredRequests[reqIndex] && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{filteredRequests[reqIndex].userId || 'Unknown Student'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{filteredRequests[reqIndex].createdAt ? new Date(filteredRequests[reqIndex].createdAt).toLocaleString() : ''}</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2"><strong>Current Course:</strong> {filteredRequests[reqIndex].currentCourse}</Typography>
              <Typography variant="body2"><strong>Requested Course:</strong> {filteredRequests[reqIndex].newCourse}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}><strong>Reason:</strong> {filteredRequests[reqIndex].reason || '-'}</Typography>
              {filteredRequests[reqIndex].status && (
                <Chip size="small" label={filteredRequests[reqIndex].status} sx={{ mt: 1 }} />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {reqIndex != null && filteredRequests[reqIndex] && !filteredRequests[reqIndex].status && (
            <>
              <Button onClick={() => { updateRequestStatus(reqIndex, 'approved'); setReqOpen(false); }} color="success">
                Approve
              </Button>
              <Button onClick={() => { updateRequestStatus(reqIndex, 'denied'); setReqOpen(false); }} variant="outlined">
                Deny
              </Button>
            </>
          )}
          <Button onClick={() => setReqOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FacultyDashboard;
