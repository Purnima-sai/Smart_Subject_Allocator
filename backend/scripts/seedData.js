const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ssaems', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data to start fresh
    await User.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Subject.deleteMany({});

    // Create sample students
    const studentPassword = await bcrypt.hash('Student@123', 10);
    const facultyPassword = await bcrypt.hash('Faculty@123', 10);
    const adminPassword = await bcrypt.hash('Admin@123', 10);

    // Sample Students
    const student1 = await User.create({
      name: 'Raj Kumar',
      email: 'raj.kumar@student.com',
      password: studentPassword,
      role: 'student'
    });

    await Student.create({
      user: student1._id,
      rollNumber: 'STU001',
      department: 'Computer Science',
      year: 2,
      semester: 4,
      cgpa: 3.8
    });

    console.log('✓ Student 1 created: raj.kumar@student.com / Student@123');

    const student2 = await User.create({
      name: 'Priya Singh',
      email: 'priya.singh@student.com',
      password: studentPassword,
      role: 'student'
    });

    await Student.create({
      user: student2._id,
      rollNumber: 'STU002',
      department: 'Information Technology',
      year: 2,
      semester: 4,
      cgpa: 3.9
    });

    console.log('✓ Student 2 created: priya.singh@student.com / Student@123');

    const student3 = await User.create({
      name: 'Arjun Patel',
      email: 'arjun.patel@student.com',
      password: studentPassword,
      role: 'student'
    });

    await Student.create({
      user: student3._id,
      rollNumber: 'STU003',
      department: 'Electronics Engineering',
      year: 3,
      semester: 6,
      cgpa: 3.6
    });

    console.log('✓ Student 3 created: arjun.patel@student.com / Student@123');

    // Sample Faculty
    const faculty1 = await User.create({
      name: 'Dr. Ramesh Kumar',
      email: 'ramesh.kumar@faculty.com',
      password: facultyPassword,
      role: 'faculty'
    });

    await Faculty.create({
      user: faculty1._id,
      name: 'Dr. Ramesh Kumar',
      email: 'ramesh.kumar@faculty.com'
    });

    console.log('✓ Faculty 1 created: ramesh.kumar@faculty.com / Faculty@123');

    const faculty2 = await User.create({
      name: 'Prof. Deepa Sharma',
      email: 'deepa.sharma@faculty.com',
      password: facultyPassword,
      role: 'faculty'
    });

    await Faculty.create({
      user: faculty2._id,
      name: 'Prof. Deepa Sharma',
      email: 'deepa.sharma@faculty.com'
    });

    console.log('✓ Faculty 2 created: deepa.sharma@faculty.com / Faculty@123');

    // Admin User
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ssaems.com',
      password: adminPassword,
      role: 'admin'
    });

    console.log('✓ Admin created: admin@ssaems.com / Admin@123');

    // Sample Subjects
    const subjects = [
      {
        code: 'CS201',
        title: 'Data Structures',
        credits: 4,
        semester: 4,
        year: 2,
        capacity: 30
      },
      {
        code: 'CS202',
        title: 'Algorithms',
        credits: 4,
        semester: 4,
        year: 2,
        capacity: 30
      },
      {
        code: 'CS203',
        title: 'Database Management',
        credits: 4,
        semester: 4,
        year: 2,
        capacity: 25
      },
      {
        code: 'EC301',
        title: 'Digital Electronics',
        credits: 4,
        semester: 6,
        year: 3,
        capacity: 35
      }
    ];

    await Subject.insertMany(subjects);
    console.log('✓ Subjects created');

    console.log('\n✅ Database seeding completed!\n');
    console.log('Sample Credentials:');
    console.log('===================');
    console.log('STUDENT:');
    console.log('  Email: raj.kumar@student.com');
    console.log('  Password: Student@123');
    console.log('');
    console.log('  Email: priya.singh@student.com');
    console.log('  Password: Student@123');
    console.log('');
    console.log('FACULTY:');
    console.log('  Email: ramesh.kumar@faculty.com');
    console.log('  Password: Faculty@123');
    console.log('');
    console.log('ADMIN:');
    console.log('  Email: admin@ssaems.com');
    console.log('  Password: Admin@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
