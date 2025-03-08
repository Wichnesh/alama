const mongoose = require("mongoose");

const studentCartSchema = new mongoose.Schema({
  studentID: {
    type: String,
    required: true,
    unique: true,
  },
  enrollDate: {
    type: String,
  },
  studentName: {
    type: String,
  },
  address: {
    type: String,
  },
  district: {
    type: String,
  },
  state: {
    type: String,
  },
  mobileNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  fatherName: {
    type: String,
  },
  motherName: {
    type: String,
  },
  franchise: {
    type: String,
  },
  franchiseState: {
    type: String,
  },
  level: {
    type: String,
  },
  items: {
    type: [String],
  },
  tShirt: {
    type: String,
  },
  program: {
    type: String,
  },
  cost: {
    type: [Number],
  },
  paymentID: {
    type: String,
  },
  certificates: {
    type: [String],
  },
  levelOrders: [
    {
      level: String,
      program: String,
      date: String,
      cost: String,
      paymentID: String,
    },
  ],
});

const StudentCartlist = (module.exports = mongoose.model(
  "StudentCartlist",
  studentCartSchema
));
