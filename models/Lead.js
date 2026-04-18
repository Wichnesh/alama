const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: String,
  phone: String,
  franchiseName: String,
  linkId: { type: String, unique: true },
  submitted: { type: Boolean, default: false },
  response: {
    state: String,
    interested: Boolean,
    submittedAt: Date
  }
});

module.exports = mongoose.model('Lead', LeadSchema);
