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
  createdAt: {
    type: String,
    default: new Date().toLocaleDateString("en-US"),
  },
});

const orderslist = (module.exports = mongoose.model(
  "Orderslist",
  ordersSchema
));
