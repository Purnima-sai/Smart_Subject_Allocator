const mongoose = require('mongoose');

const ChangeRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  currentSubject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  requestedSubject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  reason: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewComments: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', ChangeRequestSchema);
