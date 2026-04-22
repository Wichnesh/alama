const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  franchiseName: String,
  linkId: { type: String},
  uniqueId: { type: String, unique: true },
  franchiseUniqueLink: { type: Boolean, default: false },
  status: { type: String, default: 'Link sent' },
  assignedByAdmin: { type: Boolean, default: false },
  submitted: { type: Boolean, default: false },
  state: String,
  interested: Boolean,
  submittedAt: Date
});

module.exports = mongoose.model('Lead', LeadSchema);
