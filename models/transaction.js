const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  franchiseName: {
    type: String,
  },
  studentName: {
    type: String,
  },
  studentID: {
    type: String,
  },
  itemName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  currentQuantity: {
    type: Number,
    // required: true,
  },
});

const Transactionlist = (module.exports = mongoose.model(
  "Transactionlist",
  transactionSchema
));
