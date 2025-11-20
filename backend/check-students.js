const mongoose = require('mongoose');

async function checkStudents() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ssaems');
    console.log('Connected to MongoDB');

    const Student = mongoose.model('Student', new mongoose.Schema({
      rollNumber: String,
      preferences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
      cgpa: Number,
      year: Number,
      semester: Number,
      department: String
    }, { strict: false }));

    const totalStudents = await Student.countDocuments({});
    console.log('\nTotal students in database:', totalStudents);

    const studentsWithPrefs = await Student.countDocuments({ 
      preferences: { $exists: true, $ne: [] } 
    });
    console.log('Students with preferences (non-empty array):', studentsWithPrefs);

    const studentsWithoutPrefs = totalStudents - studentsWithPrefs;
    console.log('Students without preferences:', studentsWithoutPrefs);

    // Sample some students without preferences
    console.log('\n--- Sample of students WITHOUT preferences ---');
    const withoutPrefsSample = await Student.find({ 
      $or: [
        { preferences: { $exists: false } },
        { preferences: [] }
      ]
    }).limit(5).lean();

    withoutPrefsSample.forEach(s => {
      console.log(`Roll: ${s.rollNumber}, Preferences: ${JSON.stringify(s.preferences)}, CGPA: ${s.cgpa}`);
    });

    // Sample some students WITH preferences
    console.log('\n--- Sample of students WITH preferences ---');
    const withPrefsSample = await Student.find({ 
      preferences: { $exists: true, $ne: [] } 
    }).limit(5).lean();

    withPrefsSample.forEach(s => {
      console.log(`Roll: ${s.rollNumber}, Preferences count: ${s.preferences?.length || 0}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStudents();
