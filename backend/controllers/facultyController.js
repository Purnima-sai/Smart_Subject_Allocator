const Faculty = require('../models/Faculty');
const ChangeRequest = require('../models/ChangeRequest');
const Allocation = require('../models/Allocation');
const Subject = require('../models/Subject');
const Student = require('../models/Student');

exports.listFaculty = async (req, res, next) => {
  try {
    const list = await Faculty.find();
    res.json({ list });
  } catch (err) { next(err); }
};

// GET /api/faculty/change-requests?status=pending
exports.listChangeRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const faculty = await Faculty.findOne({ email: req.user && req.user.email });
    const criteria = {};
    if (status) criteria.status = status;
    let requests = await ChangeRequest.find(criteria)
      .populate('student','rollNumber')
      .populate('currentSubject','code title')
      .populate('requestedSubject','code title')
      .lean();
    if (faculty) {
      const mySubjects = await Subject.find({ instructor: faculty._id }).select('_id').lean();
      const myIds = new Set(mySubjects.map(s=>String(s._id)));
      requests = requests.filter(r => myIds.has(String(r.currentSubject?._id)) || myIds.has(String(r.requestedSubject?._id)));
    }
    res.json({ requests, count: requests.length });
  } catch (err) { next(err); }
};

// PUT approve/deny change request
exports.approveRequest = async (req, res, next) => {
  try {
    const { requestId, action } = req.body || {};
    if (!requestId || !action) return res.status(400).json({ message: 'requestId and action required' });
    if (!['approve','deny'].includes(action)) return res.status(400).json({ message: 'action must be approve|deny' });
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(requestId)) return res.status(400).json({ message: 'Invalid requestId' });
    const reqDoc = await ChangeRequest.findById(requestId).populate('student').populate('requestedSubject');
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (reqDoc.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    reqDoc.status = action === 'approve' ? 'approved' : 'denied';
    reqDoc.decidedAt = new Date();
    await reqDoc.save();

    if (reqDoc.status === 'approved') {
      await Allocation.deleteMany({ student: reqDoc.student._id, subject: reqDoc.currentSubject });
      await Allocation.create({ student: reqDoc.student._id, subject: reqDoc.requestedSubject._id, priority: null });
    }

    const populated = await ChangeRequest.findById(reqDoc._id)
      .populate('student','rollNumber')
      .populate('currentSubject','code title')
      .populate('requestedSubject','code title')
      .lean();
    res.json({ request: populated, message: `Request ${reqDoc.status}` });
  } catch (err) { next(err); }
};

// List subjects assigned to faculty
exports.listMySubjects = async (req, res, next) => {
  try {
    let faculty = await Faculty.findOne({ email: req.user && req.user.email });
    // Ensure Faculty doc exists for currently logged-in user
    if (!faculty && req.user?.name) {
      faculty = await Faculty.create({ name: req.user.name, email: req.user.email });
    }
    let subjects = [];
    if (faculty) {
      subjects = await Subject.find({ instructor: faculty._id });
      // Fallback by matching text faculty field if no linked instructor found
      if (subjects.length === 0 && req.user?.name) {
        subjects = await Subject.find({ faculty: req.user.name });
      }
    }
    res.json({ subjects });
  } catch (err) { next(err); }
};

// Download allocations CSV
exports.downloadSubjectAllocations = async (req, res, next) => {
  try {
    const subjectId = req.params.subjectId;
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    const allocations = await Allocation.find({ subject: subjectId }).populate({ path: 'student', populate: { path: 'user', select: 'name email' } }).lean();
    const rows = allocations.map(a => ({ rollNumber: a.student.rollNumber || '', name: (a.student.user && a.student.user.name) || '', cgpa: a.student.cgpa || '', priority: a.priority }));
    const filename = require('path').join(__dirname, '..', 'data', `${subject.code || subjectId}_allocations.csv`);
    const reportGenerator = require('../utils/reportGenerator');
    await reportGenerator.generateAllocationCSV(rows, filename);
    res.download(filename);
  } catch (err) { next(err); }
};

// GET /api/faculty/allocations?subjectId=...
exports.listAllocations = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const criteria = {};
    if (subjectId) criteria.subject = subjectId;
    const allocations = await Allocation.find(criteria)
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('subject','code title')
      .lean();
    const rows = allocations.map(a => ({
      student: {
        id: a.student?._id,
        name: a.student?.user?.name || 'N/A',
        email: a.student?.user?.email || 'N/A',
        rollNumber: a.student?.rollNumber || '',
        cgpa: a.student?.cgpa || 0,
      },
      subject: a.subject,
      priority: a.priority,
      assignedAt: a.assignedAt,
    }));
    res.json({ allocations: rows, count: rows.length });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════════
// FACULTY PROFILE AND ALLOCATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

// Get faculty profile
exports.getProfile = async (req, res, next) => {
  try {
    console.log('Fetching faculty profile for user:', req.user.id);
    
    const faculty = await Faculty.findOne({ user: req.user.id })
      .populate('user', 'name email')
      .lean();

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    console.log('Faculty profile found:', faculty.employeeId || faculty.email);

    res.json({
      success: true,
      faculty: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        employeeId: faculty.employeeId,
        department: faculty.department,
        experience: faculty.experience,
        designation: faculty.designation,
        specialization: faculty.specialization,
        maxLoad: faculty.maxLoad
      }
    });
  } catch (err) {
    console.error('Error fetching faculty profile:', err);
    next(err);
  }
};

// Get faculty allocations (assigned sections)
exports.getMyAllocations = async (req, res, next) => {
  try {
    console.log('Fetching allocations for faculty user:', req.user.id);

    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    const FacultyAllocation = require('../models/FacultyAllocation');
    const allocations = await FacultyAllocation.find({ 
      faculty: faculty._id,
      status: 'Active'
    })
      .populate('subject', 'code title year semester credits hours department')
      .sort({ subject: 1, section: 1 })
      .lean();

    console.log(`Found ${allocations.length} allocations for faculty`);

    res.json({
      success: true,
      allocations: allocations.map(alloc => ({
        id: alloc._id,
        subject: {
          code: alloc.subject?.code,
          title: alloc.subject?.title,
          year: alloc.subject?.year,
          semester: alloc.subject?.semester,
          credits: alloc.subject?.credits,
          hours: alloc.subject?.hours,
          department: alloc.subject?.department
        },
        section: alloc.section,
        year: alloc.year,
        semester: alloc.semester,
        assignedAt: alloc.assignedAt
      }))
    });
  } catch (err) {
    console.error('Error fetching faculty allocations:', err);
    next(err);
  }
};

// Update faculty profile
exports.updateProfile = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    const { department, experience, designation, specialization } = req.body;

    if (department !== undefined) faculty.department = department;
    if (experience !== undefined) faculty.experience = Number(experience);
    if (designation !== undefined) faculty.designation = designation;
    if (specialization !== undefined) faculty.specialization = specialization;

    await faculty.save();

    console.log('Faculty profile updated:', faculty.employeeId || faculty.email);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      faculty
    });
  } catch (err) {
    console.error('Error updating faculty profile:', err);
    next(err);
  }
};

// Get students in faculty's sections
exports.getMyStudents = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user.id });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    // Get all allocations for this faculty
    const FacultyAllocation = require('../models/FacultyAllocation');
    const facultyAllocations = await FacultyAllocation.find({ 
      faculty: faculty._id,
      status: 'Active'
    })
      .populate('subject', 'code title')
      .lean();

    if (facultyAllocations.length === 0) {
      return res.json({
        success: true,
        students: [],
        message: 'No sections assigned yet'
      });
    }

    // Get student allocations for these subject-section combinations
    const students = [];

    for (const facAlloc of facultyAllocations) {
      const studentAllocations = await Allocation.find({
        subject: facAlloc.subject._id,
        section: facAlloc.section
      })
        .populate({
          path: 'student',
          populate: { path: 'user', select: 'name email' }
        })
        .lean();

      for (const studAlloc of studentAllocations) {
        if (studAlloc.student) {
          students.push({
            rollNumber: studAlloc.student.rollNumber,
            name: studAlloc.student.user?.name,
            email: studAlloc.student.user?.email,
            department: studAlloc.student.department,
            year: studAlloc.student.year,
            semester: studAlloc.student.semester,
            cgpa: studAlloc.student.cgpa,
            subject: {
              code: facAlloc.subject.code,
              title: facAlloc.subject.title
            },
            section: studAlloc.section
          });
        }
      }
    }

    res.json({
      success: true,
      students,
      totalStudents: students.length
    });
  } catch (err) {
    console.error('Error fetching faculty students:', err);
    next(err);
  }
};
