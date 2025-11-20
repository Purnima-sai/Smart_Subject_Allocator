const mongoose = require('mongoose');const mongoose = require('mongoose');



const ChangeRequestSchema = new mongoose.Schema({// A request from a student to change their allocated subject to another subject.

  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },// status: pending (default) | approved | denied

  currentSubject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },// decidedAt set when status transitions from pending.

  requestedSubject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },const ChangeRequestSchema = new mongoose.Schema({

  reason: { type: String },  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

  status: {   currentSubject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },

    type: String,   requestedSubject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },

    enum: ['pending', 'approved', 'rejected'],   reason: { type: String, trim: true },

    default: 'pending'   status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },

  },  decidedAt: { type: Date },

  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }, // optional: who processed

  reviewedAt: { type: Date },}, { timestamps: true });

  reviewComments: { type: String }

}, { timestamps: true });module.exports = mongoose.model('ChangeRequest', ChangeRequestSchema);


module.exports = mongoose.model('ChangeRequest', ChangeRequestSchema);
