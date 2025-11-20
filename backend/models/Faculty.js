const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String },
  employeeId: { type: String, unique: true, sparse: true }, // Faculty ID
  department: { type: String },
  experience: { type: Number, default: 0 }, // Years of experience
  designation: { type: String }, // Professor, Associate Professor, Assistant Professor, etc.
  specialization: [{ type: String }], // Areas of expertise
  maxLoad: { type: Number, default: 3 }, // Maximum sections they can handle
}, { timestamps: true });

module.exports = mongoose.model('Faculty', FacultySchema);
