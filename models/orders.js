const e = require("express");
const mongoose = require("mongoose");

const ordersSchema = new mongoose.Schema({
  studentID: {
    type: String,
    required: true,
  },
  currentLevel: {
    type: String,
    required: true,
  },
  futureLevel: {
    type: String,
    required: true,
  },
  items: {
    type: [String],
    required: true,
  },
  franchise:{
    type: String
  },
  program:{
    type: String
  },
  enableBtn:{
    type:Boolean,
    default:false
  },
  transferBool:{
    type:Boolean,
    default:false
  },
  status: {
    type: String,
    default: "Pending",
  },
  createdAt: {
    type: String,
    default: new Date().toLocaleString(),
  },
});

const orderslist = (module.exports = mongoose.model(
  "Orderslist",
  ordersSchema
));
