const csvParser = require('../utils/csvParser');
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const path = require('path');
const Subject = require('../models/Subject');
const Allocation = require('../models/Allocation');
const Faculty = require('../models/Faculty');
const FacultyAllocation = require('../models/FacultyAllocation');
const reportGenerator = require('../utils/reportGenerator');
const archiver = require('archiver');
const fs = require('fs');

// Upload students CSV and create users+student docs
// expected CSV headers: name,rollNumber,email,department,year,cgpa
exports.uploadStudents = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fullPath = req.file.path;
    const rows = await csvParser.parseCSV(fullPath);
    const created = [];
    for (const row of rows) {
      const name = row.name || `${row.firstName || 'Student'}`;
      const email = row.email;
      if (!email) continue;
      const existing = await User.findOne({ email });
      if (existing) {
        // skip duplicates
        continue;
      }
  const password = (row.password) ? row.password : Math.random().toString(36).slice(-8);
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role: 'student' });
      const student = await Student.create({
        user: user._id,
        rollNumber: row.rollNumber || '',
        department: row.department || '',
        year: row.year ? Number(row.year) : undefined,
        cgpa: row.cgpa ? Number(row.cgpa) : 0,
      });
      // attempt to email credentials (best-effort)
      try {
        const emailService = require('../utils/emailService');
        await emailService.sendMail({
          from: process.env.EMAIL_FROM || 'no-reply@example.com',
          to: user.email,
          subject: 'Your SSAEMS account',
          text: `Hello ${user.name},\nYour account has been created. Login: ${user.email}\nPassword: ${password}\nPlease change your password.`,
        });
      } catch (e) {
        // ignore email errors but log
        console.warn('Email send failed for', user.email, e.message || e);
      }
      created.push({ user: user.email, student: student._id });
    }
    res.json({ message: 'Students uploaded', createdCount: created.length, created });
  } catch (err) {
    next(err);
  }
};

// Upload students with preferences from CSV file
// CSV format: Roll Number, Name, Email, Department, Year, Semester, CGPA, Priority1, Priority2, Priority3, Priority4, Priority5
exports.uploadStudentsWithPreferences = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('=== UPLOADING STUDENTS WITH PREFERENCES FROM CSV ===');
    const fullPath = req.file.path;
    if (!fs.existsSync(fullPath)) {
      return res.status(400).json({ success: false, message: `Uploaded file not found on server (path: ${fullPath}).` });
    }
    
    // Parse CSV file
    const rows = await csvParser.parseCSV(fullPath);
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty or invalid' });
    }

    console.log(`Processing ${rows.length} rows from CSV...`);

    // Fetch all subjects for preference mapping
    const subjects = await Subject.find().lean();
    const subjectCodeMap = {};
    const subjectTitleMap = {};
    subjects.forEach(s => {
      subjectCodeMap[s.code.toLowerCase()] = s._id;
      subjectTitleMap[s.title.toLowerCase()] = s._id;
    });

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];
    const processedStudents = [];

    for (const row of rows) {
      try {
        // Extract student information
        const rollNumber = row['Roll Number'] || row.rollNumber || row.roll_number || row.RollNumber;
        const name = row.Name || row.name;
        const email = row.Email || row.email;
        const department = row.Department || row.department || row.dept || 'CSE';
        const year = row.Year || row.year;
        const semester = row.Semester || row.semester || row.sem;
        const cgpa = row.CGPA || row.cgpa;

        // Validate required fields
        if (!rollNumber) {
          errors.push(`Row missing Roll Number`);
          errorCount++;
          continue;
        }

        if (!name || !email) {
          errors.push(`Student ${rollNumber}: Missing name or email`);
          errorCount++;
          continue;
        }

        // Extract preferences (Priority1-5)
        const preferenceColumns = [
          'Priority1', 'Priority2', 'Priority3', 'Priority4', 'Priority5',
          'priority1', 'priority2', 'priority3', 'priority4', 'priority5',
          'Priority 1', 'Priority 2', 'Priority 3', 'Priority 4', 'Priority 5',
          'Pref1', 'Pref2', 'Pref3', 'Pref4', 'Pref5',
          'pref1', 'pref2', 'pref3', 'pref4', 'pref5',
          'Subject1', 'Subject2', 'Subject3', 'Subject4', 'Subject5',
          'subject1', 'subject2', 'subject3', 'subject4', 'subject5'
        ];

        const preferences = [];
        for (const col of preferenceColumns) {
          if (row[col]) {
            const subjectIdentifier = row[col].toString().trim().toLowerCase();
            
            // Try to find subject by code or title
            let subjectId = subjectCodeMap[subjectIdentifier] || subjectTitleMap[subjectIdentifier];
            
            // If not found, try exact match
            if (!subjectId) {
              const exactSubject = subjects.find(s => 
                s.code.toLowerCase() === subjectIdentifier || 
                s.title.toLowerCase() === subjectIdentifier
              );
              if (exactSubject) {
                subjectId = exactSubject._id;
              }
            }

            if (subjectId && !preferences.includes(subjectId.toString())) {
              preferences.push(subjectId);
            }
          }
        }

        // Check if user exists
        let user = await User.findOne({ email });
        let student = null;

        if (user) {
          // User exists, update or find student
          student = await Student.findOne({ user: user._id });
          
          if (student) {
            // Update existing student
            student.rollNumber = rollNumber;
            student.department = department;
            if (year) student.year = Number(year);
            if (semester) student.semester = Number(semester);
            if (cgpa) student.cgpa = Number(cgpa);
            if (preferences.length > 0) {
              student.preferences = preferences;
              student.preferencesLocked = true;
              student.preferencesSubmittedAt = new Date();
            }
            await student.save();
            updatedCount++;
          } else {
            // User exists but no student record - create student
            student = await Student.create({
              user: user._id,
              rollNumber,
              department,
              year: year ? Number(year) : undefined,
              semester: semester ? Number(semester) : undefined,
              cgpa: cgpa ? Number(cgpa) : 0,
              preferences: preferences.length > 0 ? preferences : [],
              preferencesLocked: preferences.length > 0,
              preferencesSubmittedAt: preferences.length > 0 ? new Date() : undefined
            });
            createdCount++;
          }
        } else {
          // Create new user and student
          const password = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(password, 10);
          
          user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'student'
          });

          student = await Student.create({
            user: user._id,
            rollNumber,
            department,
            year: year ? Number(year) : undefined,
            semester: semester ? Number(semester) : undefined,
            cgpa: cgpa ? Number(cgpa) : 0,
            preferences: preferences.length > 0 ? preferences : [],
            preferencesLocked: preferences.length > 0,
            preferencesSubmittedAt: preferences.length > 0 ? new Date() : undefined
          });

          // Attempt to send email with credentials
          try {
            const emailService = require('../utils/emailService');
            await emailService.sendMail({
              from: process.env.EMAIL_FROM || 'no-reply@example.com',
              to: user.email,
              subject: 'Your SSAEMS Account',
              text: `Hello ${user.name},\n\nYour account has been created.\n\nLogin Email: ${user.email}\nPassword: ${password}\n\nPlease login and change your password.\n\nBest regards,\nSSAEMS Team`
            });
          } catch (emailErr) {
            console.warn('Email send failed for', user.email, emailErr.message);
          }

          createdCount++;
        }

        processedStudents.push({
          rollNumber,
          name,
          email,
          cgpa: cgpa ? Number(cgpa) : 0,
          preferencesCount: preferences.length
        });

      } catch (err) {
        console.error('Error processing row:', err);
        errors.push(`Error processing student: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`CSV Upload Complete: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors`);

    res.json({
      success: true,
      message: `Students uploaded successfully`,
      statistics: {
        totalRows: rows.length,
        createdCount,
        updatedCount,
        errorCount,
        processedCount: createdCount + updatedCount,
        errors: errors.slice(0, 20) // Return first 20 errors
      },
      students: processedStudents.slice(0, 10) // Return first 10 students for verification
    });

  } catch (err) {
    console.error('Error uploading students with preferences:', err);
    next(err);
  }
};

// Subject CRUD
exports.createSubject = async (req, res, next) => {
  try {
    let { code, title, capacity, instructor, year, semester, department, credits, hours, description, topics, faculty } = req.body;
    if (year == null || semester == null) return res.status(400).json({ message: 'year and semester are required' });

    // Auto-generate a code if not provided. If generated code collides, retry until unique.
    if (!code || !String(code).trim()) {
      const base = (title || 'SUBJ').toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 12);
      let attempt = 0;
      let candidate;
      do {
        candidate = `${base}_${Math.random().toString(36).slice(-4).toUpperCase()}`;
        attempt += 1;
        // safety: avoid infinite loop
        if (attempt > 10) break;
      } while (await Subject.exists({ code: candidate }));
      code = candidate;
    } else {
      // if provided and collides, try to make it unique by appending random suffix
      if (await Subject.exists({ code })) {
        const base = String(code).toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 12);
        let attempt = 0;
        let candidate;
        do {
          candidate = `${base}_${Math.random().toString(36).slice(-4).toUpperCase()}`;
          attempt += 1;
          if (attempt > 10) break;
        } while (await Subject.exists({ code: candidate }));
        code = candidate;
      }
    }

    const created = await Subject.create({
      code,
      title,
      capacity: capacity || 30,
      instructor,
      year: Number(year),
      semester: Number(semester),
      department: department || undefined,
      credits: credits || 3,
      hours: hours || 3,
      description: description || '',
      topics: Array.isArray(topics) ? topics : [],
      faculty: faculty || '',
    });

  // fetch populated and ensure code is present in returned object
  const subject = await Subject.findById(created._id).populate('instructor', 'name email').lean();
  // in rare cases older documents or race conditions may leave code undefined in the returned object
  // ensure we always return a code string to the client (fallback to the generated code)
  if (!subject.code) subject.code = code;
  res.status(201).json({ subject });
  } catch (err) { next(err); }
};

// Backfill codes for existing subjects that don't have a code
exports.backfillSubjectCodes = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ $or: [{ code: { $exists: false } }, { code: null }, { code: '' }] });
    const updates = [];
    for (const s of subjects) {
      const base = (s.title || 'SUBJ').toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 12);
      let code = `${base}_${Math.random().toString(36).slice(-4).toUpperCase()}`;
      // ensure unique
      while (await Subject.findOne({ code })) {
        code = `${base}_${Math.random().toString(36).slice(-4).toUpperCase()}`;
      }
      s.code = code;
      await s.save();
      updates.push({ id: s._id, code });
    }
    res.json({ updated: updates.length, details: updates });
  } catch (err) { next(err); }
};

// Dangerous: clear all subjects (admin only) — useful for demos to start clean
exports.clearAllSubjects = async (req, res, next) => {
  try {
    await Subject.deleteMany({});
    res.json({ message: 'All subjects cleared' });
  } catch (err) { next(err); }
};

exports.listSubjects = async (req, res, next) => {
  try {
    const { year, semester } = req.query;
    const criteria = {};
    if (year != null) criteria.year = Number(year);
    if (semester != null) criteria.semester = Number(semester);
    const subjects = await Subject.find(criteria).populate('instructor').lean();
    res.json({ subjects });
  } catch (err) { next(err); }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { title, capacity, year, semester, department, credits, hours, description, topics, faculty } = req.body;
    const update = {
      title,
      capacity,
      year: year != null ? Number(year) : undefined,
      semester: semester != null ? Number(semester) : undefined,
      department,
      credits,
      hours,
      description,
      topics: Array.isArray(topics) ? topics : undefined,
      faculty,
    };
    // Remove undefined values
    Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
    const subject = await Subject.findByIdAndUpdate(id, update, { new: true });
    res.json({ subject });
  } catch (err) { next(err); }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Subject.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// Seed default subjects if collection empty
exports.seedDefaults = async (req, res, next) => {
  try {
    const count = await Subject.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Subjects already exist' });
    const sample = [
      { code: 'JAVA_Y2S1', title: 'Java Programming', capacity: 40, year: 2, semester: 1 },
      { code: 'DBMS_Y2S1', title: 'Database Systems', capacity: 35, year: 2, semester: 1 },
      { code: 'ML_Y3S2', title: 'Intro to Machine Learning', capacity: 30, year: 3, semester: 2 },
      { code: 'AI_Y3S2', title: 'Artificial Intelligence', capacity: 30, year: 3, semester: 2 },
      { code: 'NET_Y4S1', title: 'Computer Networks', capacity: 30, year: 4, semester: 1 },
    ];
    const inserted = await Subject.insertMany(sample);
    res.json({ message: 'Seeded', subjects: inserted });
  } catch (err) { next(err); }
};

// Export allocations: generate subject-wise CSVs and zip them
exports.exportAllotments = async (req, res, next) => {
  try {
    // Fetch allocations and join with students & subjects
    const allocations = await Allocation.find().populate('student').populate('subject').lean();

    // Group by subject
    const map = new Map();
    for (const a of allocations) {
      const subj = a.subject || { _id: 'unknown', code: 'unknown' };
      const key = String(subj._id);
      if (!map.has(key)) map.set(key, { subject: subj, rows: [] });
      const student = a.student || {};
      map.get(key).rows.push({ studentId: student.rollNumber || '', name: (student.user && student.user.name) || '', cgpa: student.cgpa || '', priority: a.priority });
    }

    // create temp dir
    const outDir = path.join(__dirname, '..', 'data', `exports_${Date.now()}`);
    fs.mkdirSync(outDir, { recursive: true });

    const files = [];
    for (const [k, v] of map.entries()) {
      const filename = path.join(outDir, `${v.subject.code || k}.csv`);
      reportGenerator.generateAllocationCSV(v.rows, filename);
      files.push(filename);
    }

    // zip files
    const zipPath = path.join(outDir, 'allocations.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => {
      res.download(zipPath);
    });
    archive.pipe(output);
    for (const f of files) archive.file(f, { name: path.basename(f) });
    archive.finalize();

  } catch (err) { next(err); }
};

// Get all students with their registered preferences
exports.getRegisteredElectives = async (req, res, next) => {
  try {
    console.log('=== FETCHING REGISTERED ELECTIVES ===');
    // Fetch all students who have submitted preferences
    const students = await Student.find({ preferences: { $exists: true, $ne: [] } })
      .populate('user', 'name email')
      .populate('preferences', 'code title year semester')
      .lean();

    console.log(`Found ${students.length} students with preferences`);

    const registrations = students.map(student => ({
      studentId: student._id,
      rollNumber: student.rollNumber,
      name: student.user?.name || 'N/A',
      email: student.user?.email || 'N/A',
      department: student.department,
      year: student.year,
      semester: student.semester,
      cgpa: student.cgpa,
      preferencesLocked: student.preferencesLocked || false,
      submittedAt: student.preferencesSubmittedAt,
      preferences: (student.preferences || []).map((pref, index) => ({
        priority: index + 1,
        subjectId: pref._id,
        code: pref.code,
        title: pref.title,
        year: pref.year,
        semester: pref.semester
      }))
    }));

    const lockedCount = registrations.filter(r => r.preferencesLocked).length;
    console.log(`Locked: ${lockedCount}, Draft: ${registrations.length - lockedCount}`);
    console.log('=== FETCH COMPLETE ===\n');

    res.json({ 
      registrations,
      totalCount: registrations.length,
      lockedCount: lockedCount,
      message: `${registrations.length} students have registered their preferences`
    });
  } catch (err) { 
    console.error('Error fetching registered electives:', err);
    next(err); 
  }
};

// Upload student preferences from CSV file
// CSV format: Student_ID,CGPA,Subject1,Subject2,Subject3,Subject4,Subject5
// Where Subject columns contain preference ranking (1-5) or subject codes
exports.uploadPreferencesCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('=== UPLOADING STUDENT PREFERENCES FROM CSV ===');
    const fullPath = req.file.path;
    if (!fs.existsSync(fullPath)) {
      return res.status(400).json({ 
        success: false,
        message: `Uploaded file not found on server (path: ${fullPath}). Ensure backend/uploads exists and try again.`
      });
    }
    const rows = await csvParser.parseCSV(fullPath);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'CSV file is empty' });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Fetch all subjects for mapping codes to IDs
    const subjects = await Subject.find().lean();
    const subjectCodeMap = {};
    const subjectTitleMap = {};
    subjects.forEach(s => {
      subjectCodeMap[s.code.toLowerCase()] = s._id;
      subjectTitleMap[s.title.toLowerCase()] = s._id;
    });

    for (const row of rows) {
      try {
        // Expected columns: Student_ID, CGPA, Subject1, Subject2, Subject3, Subject4, Subject5
        // OR: rollNumber, cgpa, pref1, pref2, pref3, pref4, pref5
        const studentId = row.Student_ID || row.student_id || row.rollNumber || row.roll_number;
        const cgpa = row.CGPA || row.cgpa;

        if (!studentId) {
          errors.push(`Row missing Student_ID`);
          errorCount++;
          continue;
        }

        // Find student by roll number
        const student = await Student.findOne({ rollNumber: studentId });
        if (!student) {
          errors.push(`Student not found: ${studentId}`);
          errorCount++;
          continue;
        }

        // Update CGPA if provided
        if (cgpa && !isNaN(parseFloat(cgpa))) {
          student.cgpa = parseFloat(cgpa);
        }

        // Extract preferences from columns
        const preferences = [];
        const prefColumns = ['Subject1', 'Subject2', 'Subject3', 'Subject4', 'Subject5',
                            'subject1', 'subject2', 'subject3', 'subject4', 'subject5',
                            'pref1', 'pref2', 'pref3', 'pref4', 'pref5',
                            'Pref1', 'Pref2', 'Pref3', 'Pref4', 'Pref5'];

        for (const col of prefColumns) {
          if (row[col]) {
            const subjectIdentifier = row[col].toString().trim().toLowerCase();
            
            // Try to find subject by code or title
            let subjectId = subjectCodeMap[subjectIdentifier] || subjectTitleMap[subjectIdentifier];
            
            // If not found, try exact match
            if (!subjectId) {
              const exactSubject = subjects.find(s => 
                s.code.toLowerCase() === subjectIdentifier || 
                s.title.toLowerCase() === subjectIdentifier
              );
              if (exactSubject) {
                subjectId = exactSubject._id;
              }
            }

            if (subjectId && !preferences.includes(subjectId)) {
              preferences.push(subjectId);
            }
          }
        }

        if (preferences.length === 0) {
          errors.push(`No valid preferences found for student: ${studentId}`);
          errorCount++;
          continue;
        }

        // Update student preferences and lock them
        student.preferences = preferences;
        student.preferencesLocked = true;
        student.preferencesSubmittedAt = new Date();
        await student.save();

        successCount++;
      } catch (err) {
        console.error('Error processing row:', err);
        errors.push(`Error processing student: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`CSV Upload Complete: ${successCount} success, ${errorCount} errors`);

    res.json({
      success: true,
      message: `Preferences uploaded successfully`,
      statistics: {
        totalRows: rows.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    });

  } catch (err) {
    console.error('Error uploading preferences CSV:', err);
    next(err);
  }
};

// Run allocation algorithm based on CGPA and preferences
/**
 * CGPA-Based Subject Allocation Algorithm
 * 
 * This function allocates subjects to students based on:
 * 1. CGPA (highest gets first choice)
 * 2. Preference rankings (Priority 1-5)
 * 3. Subject capacity limits
 * 4. Section management (max 3 sections per subject, 75 seats each)
 * 
 * @route POST /api/admin/run-allocation
 * @access Admin only
 */
exports.runAllocationAlgorithm = async (req, res, next) => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  STARTING CGPA-BASED ALLOCATION ALGORITHM                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Configuration constants (overridable via req.body)
  let SEATS_PER_SECTION = 75;
  let MAX_SECTIONS = 3;
  // Dynamic minimum based on total students (will be computed after fetching students)
  let MIN_STUDENTS_FOR_SUBJECT = 60;

    // Extract optional filters from request body
  const { year, semester, minStudentsForSubject, seatsPerSection, maxSections } = req.body || {};
    console.log(`Filters: Year=${year || 'ALL'}, Semester=${semester || 'ALL'}`);

    // ═══════════════════════════════════════════════════════════
    // STEP 1: FETCH ALL STUDENTS WITH LOCKED PREFERENCES
    // ═══════════════════════════════════════════════════════════
    const studentQuery = { 
      preferencesLocked: true,
      preferences: { $exists: true, $ne: [] }
    };

    // Add year/semester filters if provided
    if (year) studentQuery.year = Number(year);
    if (semester) studentQuery.semester = Number(semester);

    const students = await Student.find(studentQuery)
      .populate('user', 'name email')
      .populate('preferences', '_id code title capacity year semester')
      .sort({ cgpa: -1 })  // ⭐ HIGHEST CGPA FIRST - THIS IS KEY!
      .lean();

    if (students.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No students with locked preferences found. Upload preferences CSV first or ensure students have submitted their preferences.',
        totalStudents: 0,
        allocatedCount: 0,
        unallocatedCount: 0,
        successRate: '0.0%'
      });
    }

    console.log(`✓ Found ${students.length} students with locked preferences`);
    console.log(`  Highest CGPA: ${students[0]?.cgpa || 'N/A'}`);
    console.log(`  Lowest CGPA: ${students[students.length - 1]?.cgpa || 'N/A'}\n`);

    // Dynamically relax the minimum threshold for small cohorts
    // If very small batch (< 50), allow subjects with any demand (>=1)
    if (students.length < 50) {
      MIN_STUDENTS_FOR_SUBJECT = 1;
    }
    // Apply explicit overrides from request if provided
    if (Number.isFinite(Number(minStudentsForSubject)) && Number(minStudentsForSubject) > 0) {
      MIN_STUDENTS_FOR_SUBJECT = Number(minStudentsForSubject);
    }
    if (Number.isFinite(Number(seatsPerSection)) && Number(seatsPerSection) > 0) {
      SEATS_PER_SECTION = Number(seatsPerSection);
    }
    if (Number.isFinite(Number(maxSections)) && Number(maxSections) > 0) {
      MAX_SECTIONS = Number(maxSections);
    }

    console.log(`Using settings → MIN:${MIN_STUDENTS_FOR_SUBJECT}, SEATS/SEC:${SEATS_PER_SECTION}, MAX_SECTIONS:${MAX_SECTIONS}`);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: FETCH ALL AVAILABLE SUBJECTS FOR THE COHORT
    // ═══════════════════════════════════════════════════════════
    const subjectQuery = {};
    if (year) subjectQuery.year = Number(year);
    if (semester) subjectQuery.semester = Number(semester);

    const subjects = await Subject.find(subjectQuery).lean();
    const subjectMap = {};
    subjects.forEach(s => {
      subjectMap[s._id.toString()] = s;
    });

    console.log(`✓ Found ${subjects.length} subjects available for allocation\n`);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: CALCULATE DEMAND PER SUBJECT
    // ═══════════════════════════════════════════════════════════
    const demand = {};
    students.forEach(student => {
      (student.preferences || []).forEach(pref => {
        const subjectId = pref._id.toString();
        demand[subjectId] = (demand[subjectId] || 0) + 1;
      });
    });

    console.log('📊 Subject Demand Analysis:');
    Object.entries(demand).forEach(([subjectId, count]) => {
      const subject = subjectMap[subjectId];
      const eligible = count >= MIN_STUDENTS_FOR_SUBJECT ? '✓ ELIGIBLE' : '✗ Below threshold';
      console.log(`   ${subject?.code || 'Unknown'}: ${count} students - ${eligible}`);
    });
    console.log('');

    // ═══════════════════════════════════════════════════════════
  // STEP 4: CREATE SECTIONS FOR ELIGIBLE SUBJECTS (with small-cohort fallback)
    // ═══════════════════════════════════════════════════════════
    const subjectCapacity = {}; // Track available seats: { subjectId: { A: 75, B: 75, ... } }
    
    for (const [subjectId, count] of Object.entries(demand)) {
      const subj = subjectMap[subjectId];
      if (!subj) {
        console.log(`⚠️  Subject ID ${subjectId} not found in subjectMap`);
        continue;
      }

      // Always create sections for subjects with demand, regardless of threshold
      // This ensures small cohorts can still allocate
      const sectionsNeeded = Math.min(
        Math.max(1, Math.ceil(count / SEATS_PER_SECTION)),
        MAX_SECTIONS
      );
      subjectCapacity[subjectId] = {};
      for (let i = 0; i < sectionsNeeded; i++) {
        const sectionName = String.fromCharCode(65 + i); // A, B, C
        subjectCapacity[subjectId][sectionName] = SEATS_PER_SECTION;
      }
      const totalSeats = sectionsNeeded * SEATS_PER_SECTION;
      console.log(`✓ ${subj.code}: Created ${sectionsNeeded} section(s) with ${totalSeats} total seats (demand: ${count})`);
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════
    // STEP 5: PRESERVE HISTORICAL ALLOCATIONS & RESET CURRENT STATUS
    // ═══════════════════════════════════════════════════════════
    // NOTE: We NO LONGER delete previous allocations - they are preserved for history
    // Only the Student.allocated fields are reset for the new run
    console.log(`✓ Preserving ${await Allocation.countDocuments({})} historical allocation records`);
    console.log(`  (Historical data will be available in CSV export)\n`);

    // Reset student allocation status for this cohort only
    await Student.updateMany(
      studentQuery,
      { 
        allocated: false, 
        allocation_status: 'Pending',
        allocated_subject: null,
        allocated_section: null
      }
    );
    console.log(`✓ Reset student allocation statuses for new run\n`);

    // ═══════════════════════════════════════════════════════════
    // STEP 6: ALLOCATE SUBJECTS BASED ON CGPA AND PREFERENCES
    // ═══════════════════════════════════════════════════════════
    console.log('🎯 Starting Allocation Process...\n');
    console.log('─'.repeat(80));

    const allocations = [];
    const unallocatedList = [];
    let allocatedCount = 0;
    let unallocatedCount = 0;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      let allocated = false;
      let allocatedSubject = null;
      let allocatedSection = null;
      let allocatedPriority = null;

      console.log(`\n[${i + 1}/${students.length}] ${student.rollNumber || 'N/A'} | CGPA: ${student.cgpa} | ${student.user?.name}`);

      // Try each preference in order (Priority 1 → 2 → 3 → 4 → 5)
      for (let priority = 0; priority < (student.preferences || []).length; priority++) {
        const preference = student.preferences[priority];
        const subjectId = preference._id.toString();
        const subject = subjectMap[subjectId];

        console.log(`  Priority ${priority + 1}: ${subject?.code} (${subject?.title})`);

        // Check if subject has available sections
        if (!subjectCapacity[subjectId]) {
          console.log(`    ✗ Subject not offered (below minimum demand)`);
          continue;
        }

        // Try to find an available section
        let foundSection = false;
        for (const [sectionName, seatsLeft] of Object.entries(subjectCapacity[subjectId])) {
          if (seatsLeft > 0) {
            // ✅ ALLOCATE THIS STUDENT
            allocations.push({
              student: student._id,
              subject: subjectId,
              section: sectionName,
              priority: priority + 1,
              assignedAt: new Date()
            });

            // Decrease available seats
            subjectCapacity[subjectId][sectionName] -= 1;
            
            allocatedSubject = subjectId;
            allocatedSection = sectionName;
            allocatedPriority = priority + 1;
            allocated = true;
            allocatedCount++;

            console.log(`    ✓ ALLOCATED to Section ${sectionName} (${seatsLeft - 1} seats remaining)`);
            foundSection = true;
            break;
          }
        }

        if (foundSection) break; // Stop trying other preferences
      }

      // If student wasn't allocated to any preference
      if (!allocated) {
        unallocatedCount++;
        unallocatedList.push({
          studentId: student._id,
          name: student.user?.name,
          email: student.user?.email,
          rollNumber: student.rollNumber,
          cgpa: student.cgpa,
          department: student.department,
          year: student.year,
          semester: student.semester,
          preferences: student.preferences.map(p => p.code).join(', ')
        });
        console.log(`    ✗ UNALLOCATED - All preferences full or unavailable`);
      }

      // Update student record in database
      await Student.updateOne(
        { _id: student._id },
        {
          allocated: allocated,
          allocation_status: allocated ? 'Allocated' : 'Unallocated',
          allocated_subject: allocatedSubject,
          allocated_section: allocatedSection
        }
      );
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✓ Allocation Process Complete: ${allocatedCount} allocated, ${unallocatedCount} unallocated\n`);

    // ═══════════════════════════════════════════════════════════
    // STEP 7: SAVE ALLOCATIONS TO DATABASE
    // ═══════════════════════════════════════════════════════════
    if (allocations.length > 0) {
      await Allocation.insertMany(allocations);
      console.log(`✓ Saved ${allocations.length} allocation records to database\n`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 8: CALCULATE DETAILED STATISTICS
    // ═══════════════════════════════════════════════════════════
    const subjectStats = {};

    for (const allocation of allocations) {
      const subjectId = allocation.subject.toString();
      if (!subjectStats[subjectId]) {
        const subject = subjectMap[subjectId];
        subjectStats[subjectId] = {
          subjectId: subjectId,
          subjectCode: subject?.code || 'N/A',
          subjectTitle: subject?.title || 'N/A',
          capacity: subject?.capacity || 0,
          sections: {},
          totalAllocated: 0,
          cgpaCutoff: null,
          cgpaHighest: null,
          priorityBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      // Section count
      const section = allocation.section;
      if (!subjectStats[subjectId].sections[section]) {
        subjectStats[subjectId].sections[section] = 0;
      }
      subjectStats[subjectId].sections[section] += 1;
      subjectStats[subjectId].totalAllocated += 1;

      // Priority breakdown
      if (allocation.priority) {
        subjectStats[subjectId].priorityBreakdown[allocation.priority] = 
          (subjectStats[subjectId].priorityBreakdown[allocation.priority] || 0) + 1;
      }
    }

    // Calculate CGPA cutoffs from actual allocated students
    for (const [subjectId, stat] of Object.entries(subjectStats)) {
      const allocatedToSubject = allocations.filter(a => a.subject.toString() === subjectId);
      const cgpaValues = [];
      
      for (const alloc of allocatedToSubject) {
        const student = students.find(s => s._id.toString() === alloc.student.toString());
        if (student) cgpaValues.push(student.cgpa);
      }

      if (cgpaValues.length > 0) {
        stat.cgpaCutoff = Math.min(...cgpaValues);
        stat.cgpaHighest = Math.max(...cgpaValues);
      }
    }

    // Sort by total allocated (descending)
    const sortedSubjectStats = Object.values(subjectStats).sort((a, b) => b.totalAllocated - a.totalAllocated);

    // Calculate success rate
    const successRate = students.length > 0 
      ? ((allocatedCount / students.length) * 100).toFixed(1) 
      : '0.0';

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ALLOCATION ALGORITHM COMPLETED SUCCESSFULLY              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // ═══════════════════════════════════════════════════════════
    // STEP 9: RETURN COMPREHENSIVE RESULTS
    // ═══════════════════════════════════════════════════════════
    const response = {
      success: true,
      message: `Allocation Complete! ${allocatedCount} students allocated, ${unallocatedCount} unallocated.`,
      totalStudents: students.length,
      allocatedCount: allocatedCount,
      unallocatedCount: unallocatedCount,
      successRate: `${successRate}%`,
      statistics: {
        totalStudents: students.length,
        allocated: allocatedCount,
        unallocated: unallocatedCount,
        allocationPercentage: successRate,
        totalSubjects: sortedSubjectStats.length,
        totalSections: sortedSubjectStats.reduce((sum, s) => sum + Object.keys(s.sections).length, 0)
      },
      subjectStats: sortedSubjectStats,
      unallocatedList: unallocatedList,
      allocationSettings: {
        seatsPerSection: SEATS_PER_SECTION,
        maxSections: MAX_SECTIONS,
        minStudentsForSubject: MIN_STUDENTS_FOR_SUBJECT
      },
      timestamp: new Date().toISOString()
    };

    console.log('\n🔍 FINAL RESPONSE OBJECT:');
    console.log('   allocatedCount:', allocatedCount);
    console.log('   unallocatedCount:', unallocatedCount);
    console.log('   statistics.allocated:', response.statistics.allocated);
    console.log('   statistics.unallocated:', response.statistics.unallocated);
    console.log('   Response will be sent to frontend...\n');

    res.json(response);

  } catch (err) {
    console.error('\n❌ ERROR in Allocation Algorithm:', err);
    console.error('Stack trace:', err.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to run allocation algorithm',
      error: err.message,
      totalStudents: 0,
      allocatedCount: 0,
      unallocatedCount: 0,
      successRate: '0.0%',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Export allocation results as CSV (including historical data)
exports.exportAllocationCSV = async (req, res, next) => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  EXPORTING COMPLETE ALLOCATION RESULTS (COMBINED)         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Fetch faculty allocations first
    const FacultyAllocation = require('../models/FacultyAllocation');
    const Faculty = require('../models/Faculty');
    
    const facultyAllocations = await FacultyAllocation.find({ status: 'Active' })
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' },
        select: 'name email employeeId designation experience user'
      })
      .populate('subject', 'code title year semester credits hours')
      .lean();

    console.log(`Found ${facultyAllocations.length} faculty allocation records`);

    // Create a map for quick lookup: subject+section -> faculty
    const facultyMap = new Map();
    for (const facAlloc of facultyAllocations) {
      const key = `${facAlloc.subject?._id}-${facAlloc.section}`;
      facultyMap.set(key, {
        name: facAlloc.faculty?.name || facAlloc.faculty?.user?.name || 'N/A',
        email: facAlloc.faculty?.email || facAlloc.faculty?.user?.email || 'N/A',
        employeeId: facAlloc.faculty?.employeeId || 'N/A',
        designation: facAlloc.faculty?.designation || 'N/A',
        experience: facAlloc.faculty?.experience || 0
      });
    }

    // Fetch current allocation status from students (only those who submitted preferences)
    const allStudents = await Student.find({ preferencesLocked: true })
      .populate('user', 'name email')
      .populate('allocated_subject', 'code title year semester credits hours faculty')
      .lean();

    console.log(`Found ${allStudents.length} students with submitted preferences`);

    if (allStudents.length === 0) {
      return res.status(404).json({ 
        message: 'No allocation data found. Please run allocation first.' 
      });
    }

    // Prepare CSV data
    const csvData = [];
    
    // ═══════════════════════════════════════════════════════════
    // COMBINED STUDENT & FACULTY ALLOCATION EXPORT
    // ═══════════════════════════════════════════════════════════
    csvData.push(['═══════════════════════════════════════════════════════════════════════════════════']);
    csvData.push(['STUDENT & FACULTY ALLOCATION REPORT']);
    csvData.push(['Complete allocation data with assigned faculty information']);
    csvData.push(['═══════════════════════════════════════════════════════════════════════════════════']);
    csvData.push([]);
    
    csvData.push([
      'S.No',
      'Roll Number',
      'Student Name',
      'Student Email',
      'Department',
      'Year',
      'Semester',
      'CGPA',
      'Allocation Status',
      'Allocated Subject Code',
      'Allocated Subject Title',
      'Section',
      'Credits',
      'Hours/Week',
      'Faculty Name',
      'Faculty Email',
      'Faculty ID',
      'Faculty Designation',
      'Faculty Experience (Years)'
    ]);

    // Categorize students
    const allocatedStudents = allStudents.filter(s => s.allocated);
    const unallocatedStudents = allStudents.filter(s => !s.allocated);

    let serialNo = 1;

    // Add allocated students with their faculty information
    for (const student of allocatedStudents) {
      // Find allocated faculty for this student's subject-section
      const facultyKey = `${student.allocated_subject?._id}-${student.allocated_section}`;
      const allocatedFaculty = facultyMap.get(facultyKey);
      
      csvData.push([
        serialNo++,
        student.rollNumber || 'N/A',
        student.user?.name || 'N/A',
        student.user?.email || 'N/A',
        student.department || 'N/A',
        student.year || 'N/A',
        student.semester || 'N/A',
        student.cgpa || 'N/A',
        'Allocated',
        student.allocated_subject?.code || 'N/A',
        student.allocated_subject?.title || 'N/A',
        student.allocated_section || 'N/A',
        student.allocated_subject?.credits || 'N/A',
        student.allocated_subject?.hours || 'N/A',
        allocatedFaculty?.name || 'Not Assigned',
        allocatedFaculty?.email || 'N/A',
        allocatedFaculty?.employeeId || 'N/A',
        allocatedFaculty?.designation || 'N/A',
        allocatedFaculty?.experience || 'N/A'
      ]);
    }

    // Add unallocated students
    for (const student of unallocatedStudents) {
      csvData.push([
        serialNo++,
        student.rollNumber || 'N/A',
        student.user?.name || 'N/A',
        student.user?.email || 'N/A',
        student.department || 'N/A',
        student.year || 'N/A',
        student.semester || 'N/A',
        student.cgpa || 'N/A',
        'Unallocated',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A'
      ]);
    }
    csvData.push([]);
    csvData.push([]);

    // ═══════════════════════════════════════════════════════════
    // SUMMARY STATISTICS
    // ═══════════════════════════════════════════════════════════
    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push(['SUMMARY STATISTICS']);
    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push([]);
    csvData.push(['Metric', 'Count']);
    csvData.push(['Total Students (Submitted Preferences)', allStudents.length]);
    csvData.push(['Successfully Allocated', allocatedStudents.length]);
    csvData.push(['Unallocated', unallocatedStudents.length]);
    csvData.push(['Faculty Allocations', facultyAllocations.length]);
    csvData.push(['Success Rate', allocatedStudents.length > 0 ? `${((allocatedStudents.length / allStudents.length) * 100).toFixed(1)}%` : '0%']);
    csvData.push([]);
    csvData.push(['Export Generated', new Date().toLocaleString()]);

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => {
        // Escape cells containing commas, quotes, or newlines
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Set response headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `student_faculty_allocation_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

    console.log(`✓ Sending combined CSV file: ${filename}`);
    console.log(`  Total Students: ${allStudents.length}`);
    console.log(`  Successfully Allocated: ${allocatedStudents.length}`);
    console.log(`  Unallocated: ${unallocatedStudents.length}`);
    console.log(`  Faculty Allocations: ${facultyAllocations.length}`);
    console.log(`  Total CSV rows: ${csvData.length}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    res.send(csvContent);

  } catch (err) {
    console.error('❌ Error exporting allocation CSV:', err);
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FACULTY ALLOCATION ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Allocate Faculty to Sections Based on Experience
 * 
 * Algorithm:
 * 1. Find all subjects with allocated students (subjects with active sections)
 * 2. Fetch all faculty sorted by experience (descending)
 * 3. For each subject's sections, assign faculty in order:
 *    - Most experienced faculty → Section A
 *    - Next experienced → Section B
 *    - Next experienced → Section C
 * 4. Respect faculty maxLoad (maximum sections per faculty)
 * 5. Create FacultyAllocation records with timestamps
 * 
 * @route POST /api/admin/allocate-faculty
 * @access Admin only
 */
exports.allocateFaculty = async (req, res, next) => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  STARTING EXPERIENCE-BASED FACULTY ALLOCATION             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const { year, semester } = req.body || {};

    // ═══════════════════════════════════════════════════════════
    // STEP 1: FIND SUBJECTS WITH ACTIVE SECTIONS
    // ═══════════════════════════════════════════════════════════
    
    // Find all student allocations to determine which subjects have active sections
    const allocationQuery = {};
    if (year) allocationQuery.year = Number(year);
    if (semester) allocationQuery.semester = Number(semester);

    // Get unique subject-section combinations from student allocations
    const studentAllocations = await Allocation.find({})
      .populate('subject', 'code title year semester department')
      .lean();

    if (studentAllocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No student allocations found. Please run student allocation first.'
      });
    }

    // Group by subject and collect sections
    const subjectSectionsMap = {}; // { subjectId: { sections: ['A', 'B'], subject: {...} } }
    
    studentAllocations.forEach(alloc => {
      if (!alloc.subject) return;
      
      const subjectId = alloc.subject._id.toString();
      const section = alloc.section;
      
      if (!subjectSectionsMap[subjectId]) {
        subjectSectionsMap[subjectId] = {
          subject: alloc.subject,
          sections: new Set()
        };
      }
      
      if (section) {
        subjectSectionsMap[subjectId].sections.add(section);
      }
    });

    // Convert Sets to sorted arrays (A, B, C)
    const subjectsWithSections = [];
    for (const [subjectId, data] of Object.entries(subjectSectionsMap)) {
      const sectionsArray = Array.from(data.sections).sort();
      subjectsWithSections.push({
        subjectId,
        subject: data.subject,
        sections: sectionsArray
      });
    }

    console.log(`✓ Found ${subjectsWithSections.length} subjects with active sections`);
    subjectsWithSections.forEach(item => {
      console.log(`  ${item.subject.code}: Sections ${item.sections.join(', ')}`);
    });
    console.log('');

    // ═══════════════════════════════════════════════════════════
    // STEP 2: FETCH ALL FACULTY SORTED BY EXPERIENCE
    // ═══════════════════════════════════════════════════════════
    const allFaculty = await Faculty.find({})
      .sort({ experience: -1, name: 1 }) // Highest experience first
      .lean();

    if (allFaculty.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No faculty found in database. Please add faculty first.'
      });
    }

    console.log(`✓ Found ${allFaculty.length} faculty members`);
    console.log(`  Most experienced: ${allFaculty[0]?.name} (${allFaculty[0]?.experience || 0} years)`);
    console.log(`  Least experienced: ${allFaculty[allFaculty.length - 1]?.name} (${allFaculty[allFaculty.length - 1]?.experience || 0} years)\n`);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: PRESERVE HISTORICAL FACULTY ALLOCATIONS
    // ═══════════════════════════════════════════════════════════
    console.log(`✓ Preserving ${await FacultyAllocation.countDocuments({})} historical faculty allocation records`);
    console.log(`  (Historical data will be available in CSV export)\n`);

    // ═══════════════════════════════════════════════════════════
    // STEP 4: ALLOCATE FACULTY TO SECTIONS
    // ═══════════════════════════════════════════════════════════
    console.log('🎯 Starting Faculty Allocation Process...\n');
    console.log('─'.repeat(80));

    const facultyAllocations = [];
    const facultyLoadTracker = {}; // Track how many sections each faculty has
    let facultyIndex = 0;

    for (const item of subjectsWithSections) {
      const { subjectId, subject, sections } = item;

      console.log(`\n${subject.code} - ${subject.title}`);
      console.log(`  Sections to allocate: ${sections.join(', ')}`);

      for (const section of sections) {
        // Find next available faculty with capacity
        let facultyAssigned = false;
        let attempts = 0;
        const maxAttempts = allFaculty.length;

        while (!facultyAssigned && attempts < maxAttempts) {
          const faculty = allFaculty[facultyIndex % allFaculty.length];
          const facultyId = faculty._id.toString();
          
          // Check if faculty has capacity
          const currentLoad = facultyLoadTracker[facultyId] || 0;
          const maxLoad = faculty.maxLoad || 3;

          if (currentLoad < maxLoad) {
            // Assign this faculty to this section
            facultyAllocations.push({
              faculty: faculty._id,
              subject: subjectId,
              section: section,
              year: subject.year,
              semester: subject.semester,
              assignedAt: new Date(),
              status: 'Active'
            });

            // Update load tracker
            facultyLoadTracker[facultyId] = currentLoad + 1;

            console.log(`  Section ${section} → ${faculty.name} (${faculty.experience || 0} yrs exp) [Load: ${currentLoad + 1}/${maxLoad}]`);
            
            facultyAssigned = true;
            facultyIndex++;
          } else {
            // Faculty at capacity, try next one
            facultyIndex++;
            attempts++;
          }
        }

        if (!facultyAssigned) {
          console.log(`  Section ${section} → ⚠️  NO FACULTY AVAILABLE (all at capacity)`);
        }
      }
    }

    console.log('\n─'.repeat(80));

    // ═══════════════════════════════════════════════════════════
    // STEP 5: SAVE FACULTY ALLOCATIONS TO DATABASE
    // ═══════════════════════════════════════════════════════════
    if (facultyAllocations.length > 0) {
      await FacultyAllocation.insertMany(facultyAllocations);
      console.log(`\n✓ Saved ${facultyAllocations.length} faculty allocation records\n`);
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 6: GENERATE STATISTICS
    // ═══════════════════════════════════════════════════════════
    const totalSections = subjectsWithSections.reduce((sum, item) => sum + item.sections.length, 0);
    const allocatedSections = facultyAllocations.length;
    const unallocatedSections = totalSections - allocatedSections;

    const statistics = {
      totalSubjects: subjectsWithSections.length,
      totalSections,
      allocatedSections,
      unallocatedSections,
      totalFaculty: allFaculty.length,
      facultyUtilized: Object.keys(facultyLoadTracker).length,
      successRate: totalSections > 0 ? ((allocatedSections / totalSections) * 100).toFixed(1) + '%' : '0%'
    };

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  FACULTY ALLOCATION COMPLETED SUCCESSFULLY                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Faculty Allocation Summary:');
    console.log(`   Total Subjects: ${statistics.totalSubjects}`);
    console.log(`   Total Sections: ${statistics.totalSections}`);
    console.log(`   Allocated: ${statistics.allocatedSections}`);
    console.log(`   Unallocated: ${statistics.unallocatedSections}`);
    console.log(`   Success Rate: ${statistics.successRate}`);
    console.log(`   Faculty Utilized: ${statistics.facultyUtilized}/${statistics.totalFaculty}\n`);

    res.json({
      success: true,
      message: 'Faculty allocation completed successfully',
      allocatedSections: statistics.allocatedSections,
      unallocatedSections: statistics.unallocatedSections,
      statistics
    });

  } catch (err) {
    console.error('❌ Error in faculty allocation:', err);
    next(err);
  }
};

// Export Faculty Allocation Results as CSV
exports.exportFacultyAllocationCSV = async (req, res, next) => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  EXPORTING FACULTY ALLOCATION RESULTS TO CSV              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Fetch ALL faculty allocation records (current + historical)
    const allFacultyAllocations = await FacultyAllocation.find({})
      .populate('faculty', 'name email department experience designation')
      .populate('subject', 'code title year semester department credits hours')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${allFacultyAllocations.length} total faculty allocation records`);

    if (allFacultyAllocations.length === 0) {
      return res.status(404).json({
        message: 'No faculty allocation data found. Please run faculty allocation first.'
      });
    }

    // Prepare CSV data
    const csvData = [];

    // ═══════════════════════════════════════════════════════════
    // SECTION 1: ALL FACULTY ALLOCATION RECORDS
    // ═══════════════════════════════════════════════════════════
    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push(['COMPLETE FACULTY ALLOCATION HISTORY']);
    csvData.push(['All faculty-section assignments including previous runs']);
    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push([]);

    csvData.push([
      'Allocation ID',
      'Faculty Name',
      'Faculty Email',
      'Department',
      'Experience (Years)',
      'Designation',
      'Subject Code',
      'Subject Title',
      'Section',
      'Year',
      'Semester',
      'Credits',
      'Hours/Week',
      'Status',
      'Assigned Date',
      'Created At',
      'Updated At'
    ]);

    // Add all faculty allocation records
    for (const allocation of allFacultyAllocations) {
      const faculty = allocation.faculty;
      const subject = allocation.subject;

      csvData.push([
        allocation._id.toString(),
        faculty?.name || 'N/A',
        faculty?.email || 'N/A',
        faculty?.department || 'N/A',
        faculty?.experience || 0,
        faculty?.designation || 'N/A',
        subject?.code || 'N/A',
        subject?.title || 'N/A',
        allocation.section || 'N/A',
        allocation.year || 'N/A',
        allocation.semester || 'N/A',
        subject?.credits || 'N/A',
        subject?.hours || 'N/A',
        allocation.status || 'Active',
        allocation.assignedAt ? new Date(allocation.assignedAt).toLocaleString() : 'N/A',
        allocation.createdAt ? new Date(allocation.createdAt).toLocaleString() : 'N/A',
        allocation.updatedAt ? new Date(allocation.updatedAt).toLocaleString() : 'N/A'
      ]);
    }

    csvData.push([]);
    csvData.push([]);

    // ═══════════════════════════════════════════════════════════
    // SECTION 2: CURRENT ACTIVE ALLOCATIONS
    // ═══════════════════════════════════════════════════════════
    const activeAllocations = allFacultyAllocations.filter(a => a.status === 'Active');

    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push(['CURRENT ACTIVE FACULTY ALLOCATIONS']);
    csvData.push(['Latest active assignments']);
    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push([]);

    csvData.push([
      'Faculty Name',
      'Experience',
      'Subject Code',
      'Subject Title',
      'Section',
      'Year',
      'Semester',
      'Assigned Date'
    ]);

    for (const allocation of activeAllocations) {
      csvData.push([
        allocation.faculty?.name || 'N/A',
        allocation.faculty?.experience || 0,
        allocation.subject?.code || 'N/A',
        allocation.subject?.title || 'N/A',
        allocation.section || 'N/A',
        allocation.year || 'N/A',
        allocation.semester || 'N/A',
        allocation.assignedAt ? new Date(allocation.assignedAt).toLocaleString() : 'N/A'
      ]);
    }

    csvData.push([]);
    csvData.push([]);

    // ═══════════════════════════════════════════════════════════
    // SECTION 3: FACULTY LOAD SUMMARY
    // ═══════════════════════════════════════════════════════════
    const facultyLoadMap = {};
    activeAllocations.forEach(alloc => {
      const facultyName = alloc.faculty?.name || 'Unknown';
      if (!facultyLoadMap[facultyName]) {
        facultyLoadMap[facultyName] = {
          experience: alloc.faculty?.experience || 0,
          sections: []
        };
      }
      facultyLoadMap[facultyName].sections.push(`${alloc.subject?.code}-${alloc.section}`);
    });

    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push(['FACULTY WORKLOAD SUMMARY']);
    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push([]);

    csvData.push(['Faculty Name', 'Experience (Years)', 'Total Sections', 'Sections Assigned']);

    for (const [facultyName, data] of Object.entries(facultyLoadMap)) {
      csvData.push([
        facultyName,
        data.experience,
        data.sections.length,
        data.sections.join(', ')
      ]);
    }

    csvData.push([]);
    csvData.push([]);

    // ═══════════════════════════════════════════════════════════
    // SECTION 4: SUMMARY STATISTICS
    // ═══════════════════════════════════════════════════════════
    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push(['SUMMARY STATISTICS']);
    csvData.push(['═══════════════════════════════════════════════════════════']);
    csvData.push([]);
    csvData.push(['Metric', 'Count']);
    csvData.push(['Total Allocation Records', allFacultyAllocations.length]);
    csvData.push(['Active Allocations', activeAllocations.length]);
    csvData.push(['Faculty Utilized', Object.keys(facultyLoadMap).length]);
    csvData.push([]);
    csvData.push(['Export Generated', new Date().toLocaleString()]);

    // Convert to CSV string
    const csvContent = csvData.map(row =>
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');

    // Set response headers
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `faculty_allocation_history_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

    console.log(`✓ Sending faculty allocation CSV: ${filename}`);
    console.log(`  Total Records: ${allFacultyAllocations.length}`);
    console.log(`  Active Allocations: ${activeAllocations.length}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    res.send(csvContent);

  } catch (err) {
    console.error('❌ Error exporting faculty allocation CSV:', err);
    next(err);
  }
};
