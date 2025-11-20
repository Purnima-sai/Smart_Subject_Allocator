const Student = require('../models/Student');

exports.getProfile = async (req, res, next) => {
  try {
    console.log('Fetching profile for user:', req.user.id);
    const student = await Student.findOne({ user: req.user.id })
      .populate('user', 'name email')
      .populate('preferences', 'code title year semester credits hours description topics');
    
    if (!student) {
      console.log('Student profile not found for user:', req.user.id);
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    console.log('Profile found - Roll:', student.rollNumber, 'Preferences:', student.preferences?.length || 0, 'Locked:', student.preferencesLocked);
    
    // Return student data in a flat structure for easier frontend use
    const profileData = {
      rollNumber: student.rollNumber,
      year: student.year,
      semester: student.semester,
      cgpa: student.cgpa,
      department: student.department,
      allocated: student.allocated,
      preferences: student.preferences || [],
      preferencesLocked: student.preferencesLocked || false,
      preferencesSubmittedAt: student.preferencesSubmittedAt,
      name: student.user?.name,
      email: student.user?.email
    };
    
    res.json(profileData);
  } catch (err) {
    console.error('Error in getProfile:', err);
    next(err);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    console.log('=== PREFERENCE SUBMISSION ===');
    console.log('Received preferences:', preferences);
    console.log('User ID:', req.user.id);
    console.log('User email:', req.user.email);
    
    // Validate input
    if (!Array.isArray(preferences)) {
      console.log('✗ Validation failed: Not an array');
      return res.status(400).json({ message: 'Preferences should be an array' });
    }
    
    if (preferences.length === 0) {
      console.log('✗ Validation failed: Empty array');
      return res.status(400).json({ message: 'Please select at least one preference' });
    }
    
    if (preferences.length > 5) {
      console.log('✗ Validation failed: Too many preferences');
      return res.status(400).json({ message: 'Max 5 preferences allowed' });
    }
    
    // Check if preferences are already locked
    const existingStudent = await Student.findOne({ user: req.user.id });
    console.log('Existing student found:', !!existingStudent);
    
    if (existingStudent) {
      console.log('Preferences locked:', existingStudent.preferencesLocked);
      console.log('Existing preferences count:', existingStudent.preferences?.length || 0);
      
      if (existingStudent.preferencesLocked) {
        console.log('✗ Preferences already locked');
        return res.status(403).json({ message: 'Preferences are locked and cannot be modified' });
      }
    }
    
    // Validate subject ids exist
    const Subject = require('../models/Subject');
    
    // Check if all preferences are valid ObjectIds
    const mongoose = require('mongoose');
    const invalidIds = preferences.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      console.log('✗ Invalid ObjectIds:', invalidIds);
      return res.status(400).json({ message: 'Invalid subject IDs provided' });
    }
    
    const valid = await Subject.countDocuments({ _id: { $in: preferences } });
    console.log('Valid subjects found:', valid, '/ Expected:', preferences.length);
    
    if (valid !== preferences.length) {
      console.log('✗ Subject validation failed');
      return res.status(400).json({ message: 'One or more subject IDs do not exist' });
    }
    
    // Update preferences and lock them
    console.log('Updating student preferences...');
    const student = await Student.findOneAndUpdate(
      { user: req.user.id }, 
      { 
        preferences, 
        preferencesLocked: true,
        preferencesSubmittedAt: new Date()
      }, 
      { new: true, upsert: true }
    ).populate('preferences', 'code title year semester credits hours');
    
    console.log('✓ Student updated successfully');
    console.log('New preferences count:', student.preferences?.length || 0);
    console.log('Lock status:', student.preferencesLocked);
    console.log('=== SUBMISSION COMPLETE ===\n');
    
    res.json({ 
      success: true,
      student: {
        rollNumber: student.rollNumber,
        year: student.year,
        semester: student.semester,
        cgpa: student.cgpa,
        department: student.department,
        preferences: student.preferences,
        preferencesLocked: student.preferencesLocked,
        preferencesSubmittedAt: student.preferencesSubmittedAt
      },
      message: 'Preferences submitted and locked successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllocationResult = async (req, res, next) => {
  try {
    console.log('=== FETCHING ALLOCATION RESULT ===');
    console.log('User ID:', req.user.id);
    
    const Allocation = require('../models/Allocation');
    const student = await Student.findOne({ user: req.user.id })
      .populate('allocated_subject', 'code title year semester credits hours description topics faculty')
      .lean();
    
    if (!student) {
      console.log('✗ Student not found');
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('Student found:', student.rollNumber);
    console.log('Allocation status:', student.allocation_status);
    console.log('Allocated:', student.allocated);
    console.log('Allocated subject:', student.allocated_subject?._id);
    console.log('Allocated section:', student.allocated_section);
    
    // Check if student has been allocated
    if (!student.allocated || !student.allocated_subject) {
      console.log('✗ No allocation found for student');
      return res.json({ 
        allocated: false,
        status: student.allocation_status || 'Pending',
        message: 'No subject has been allocated yet. Please wait for the allocation process.'
      });
    }
    
    // Get full allocation details
    const allocation = await Allocation.findOne({ student: student._id })
      .populate('subject', 'code title year semester credits hours description topics faculty')
      .lean();
    
    console.log('Allocation record found:', !!allocation);
    if (allocation) {
      console.log('Priority:', allocation.priority);
      console.log('Section:', allocation.section);
      console.log('Assigned at:', allocation.assignedAt);
    }
    
    const result = {
      allocated: true,
      status: student.allocation_status,
      allocation: {
        subject: student.allocated_subject,
        section: student.allocated_section,
        priority: allocation?.priority || null,
        assignedAt: allocation?.assignedAt || null
      }
    };
    
    console.log('✓ Sending allocation result');
    console.log('=== FETCH COMPLETE ===\n');
    
    res.json(result);
  } catch (err) { 
    console.error('Error in getAllocationResult:', err);
    next(err); 
  }
};

exports.downloadConfirmationSlip = async (req, res, next) => {
  try {
    const Allocation = require('../models/Allocation');
    const student = await Student.findOne({ user: req.user.id }).populate('user');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const alloc = await Allocation.findOne({ student: student._id }).populate('subject').lean();
    if (!alloc) return res.status(404).json({ message: 'No allocation found' });
    const pdfGen = require('../utils/pdfGenerator');
    const buffer = await pdfGen.generateConfirmationSlip(student, alloc);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=confirmation_${student.rollNumber || student._id}.pdf`);
    res.send(buffer);
  } catch (err) { next(err); }
};

// POST /api/students/change-requests
// Body: { currentSubjectId, requestedSubjectId, reason }
exports.createChangeRequest = async (req, res, next) => {
  try {
    const { currentSubjectId, requestedSubjectId, reason } = req.body || {};
    if (!currentSubjectId || !requestedSubjectId) {
      return res.status(400).json({ message: 'currentSubjectId and requestedSubjectId are required' });
    }
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(currentSubjectId) || !mongoose.Types.ObjectId.isValid(requestedSubjectId)) {
      return res.status(400).json({ message: 'Invalid subject id(s)' });
    }

    const Subject = require('../models/Subject');
    const ChangeRequest = require('../models/ChangeRequest');
    const Student = require('../models/Student');
    const FacultyAllocation = require('../models/FacultyAllocation');

    // Verify student and current allocation context
    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const currentSubject = await Subject.findById(currentSubjectId);
    const requestedSubject = await Subject.findById(requestedSubjectId);
    if (!currentSubject || !requestedSubject) return res.status(404).json({ message: 'Subject not found' });

    let assignedFaculty = null;

    // Find the faculty teaching this student's current subject and section
    if (student.allocated_section) {
      const facultyAllocation = await FacultyAllocation.findOne({
        subject: currentSubjectId,
        section: student.allocated_section,
        status: 'Active'
      });

      if (facultyAllocation) {
        assignedFaculty = facultyAllocation.faculty;
        console.log(`✓ Change request assigned to faculty teaching ${currentSubject.code} Section ${student.allocated_section}`);
      }
    }

    // Optional: prevent duplicate pending requests for same student
    const existingPending = await ChangeRequest.findOne({ student: student._id, status: 'pending' });
    if (existingPending) return res.status(400).json({ message: 'You already have a pending request' });

    const created = await ChangeRequest.create({
      student: student._id,
      currentSubject: currentSubject._id,
      requestedSubject: requestedSubject._id,
      reason: reason || '',
      faculty: assignedFaculty, // Assign to the faculty teaching this section
    });

    const populated = await ChangeRequest.findById(created._id)
      .populate('student', 'rollNumber')
      .populate('currentSubject', 'code title')
      .populate('requestedSubject', 'code title')
      .populate('faculty', 'employeeId')
      .lean();

    res.status(201).json({ 
      request: populated, 
      message: assignedFaculty 
        ? 'Change request submitted and sent to your faculty for approval' 
        : 'Change request submitted for admin review' 
    });
  } catch (err) {
    next(err);
  }
};
