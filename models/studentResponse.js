const mongoose = require("mongoose");

const studentResponseSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  franchiseID: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  interested: {
    type: Boolean,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  assignedToFranchiseID: {
    type: String,
    default: null,
  },
  assignedAt: {
    type: Date,
    default: null,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
});

// Ensure unique submission per phone number per franchise
studentResponseSchema.index({ phoneNumber: 1, franchiseID: 1 }, { unique: true });

const StudentResponse = (module.exports = mongoose.model(
  "StudentResponse",
  studentResponseSchema
));
