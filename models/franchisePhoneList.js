const mongoose = require("mongoose");

const franchisePhoneListSchema = new mongoose.Schema({
  franchiseID: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: null,
  },
    linkSent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique combination of franchiseID and phoneNumber
franchisePhoneListSchema.index({ franchiseID: 1, phoneNumber: 1 }, { unique: true });

const FranchisePhoneList = (module.exports = mongoose.model(
  "FranchisePhoneList",
  franchisePhoneListSchema
));
