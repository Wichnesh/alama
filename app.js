var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var path = require("path");
var mongoose = require("mongoose");
require("dotenv").config();
const cron = require("node-cron");
const Orders = require("./models/razorpayOrders");
const axios = require("axios");

var app = express();

const port = process.env.PORT || 3000;

const dbUrl = process.env.MONGOLOCAL;
const ConnectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
//Connect to mongoDB
mongoose
  .connect(dbUrl, ConnectionParams)
  .then(() => {
    console.log("connected to Online DB");
  })
  .catch((err) => {
    console.log(err);
  });
mongoose.connection.on("error", (err) => {
  if (err) {
    console.log("Error in DB connection " + err);
  }
});

app.use(cors());
app.use(bodyParser.json());
const route = require("./routes/route");
app.use("/api/v1", route);

app.get("/", (req, res) => {
  res.send("Home");
});


app.listen(port, () => {
  console.log("Server started at PORT", port);
});


// Run a cron job every 10 minutes to check the status of the payment and update the status in the database if the payment is successful. or make it failed itf time is more than 10 minutes.



// cron.schedule("*/10 * * * *", async () => {
//   console.log("Running a task every 10 minutes");
//   const payments = await Orders.find({ status: "created" });
//   payments.forEach(async (payment) => {
//     const time = new Date(payment.createdAt);
//     const currentTime = new Date();
//     const diff = currentTime - time;
//     if (diff > 600000) {
//       const response = await axios.get(
//         `https://api.paystack.co/transaction/verify/${payment.reference}`,
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           },
//         }
//       );
//       if (response.data.data.status === "success") {
//         await Payment.findByIdAndUpdate(payment._id, {
//           status: "success",
//         });
//       } else {
//         await Payment.findByIdAndUpdate(payment._id, {
//           status: "failed",
//         });
//       }
//     }
//   });
// });
