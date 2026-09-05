const mongoose = require("mongoose");

const studentLevelChangeRequestSchema = new mongoose.Schema(
  {
    studentID: {
      type: String,
      required: true,
      unique: true,
    },
    franchise: {
      type: String,
      required: true,
    },
    currentLevel: {
      type: String,
    },
    currentProgram: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: String,
    },
    reviewNote: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StudentLevelChangeRequest",
  studentLevelChangeRequestSchema
);