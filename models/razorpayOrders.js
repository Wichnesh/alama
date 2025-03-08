const mongoose = require("mongoose");

// {
//     "id": "order_EKwxwAgItmmXdp",
//     "entity": "order",
//     "amount": 50000,
//     "amount_paid": 0,
//     "amount_due": 50000,
//     "currency": "INR",
//     "receipt": "receipt#1",
//     "offer_id": null,
//     "status": "created",
//     "attempts": 0,
//     "notes": [],
//     "created_at": 1582628071
//   }

const razorpayOrdersSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  entity: {
    type: String,
  },
  amount: {
    type: Number,
  },
  amount_paid: {
    type: Number,
  },
  amount_due: {
    type: Number,
  },
  currency: {
    type: String,
    required: true,
  },
  receipt: {
    type: String,
  },
  offer_id: {
    type: String,
  },
  status: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
  },
  notes: {
    type: Array,
  },
  created_at: {
    type: Number,
    required: true,
  },
});

const razorpayOrders = (module.exports = mongoose.model(
  "RazorpayOrders",
  razorpayOrdersSchema
));
