var express = require("express");
var route = express.Router();
const jwt = require("jsonwebtoken");
var Franchiselist = require("../models/franchise");
var Studentlist = require("../models/students");
var StudentCartlist = require("../models/studentsCart");
var Itemlist = require("../models/items");
var Transactionlist = require("../models/transaction");
var Orderslist = require("../models/orders");
var razorpayOrders = require("../models/razorpayOrders");
const mongoose = require("mongoose");
const studentsCart = require("../models/studentsCart");
const {
  createOrder,
  RPcreateOrder,
  RPcheckStatus,
} = require("../utils/razorpayApis");

let totalItems;
itemsUpdate();
async function itemsUpdate() {
  totalItems = await Itemlist.find({});
}
//MAKE ADMIN
route.post("/makeAdmin", async (req, res, next) => {
  let { franchiseID } = req.body;
  try {
    const filter = { franchiseID: franchiseID };
    const update = {
      isAdmin: true,
    };
    let updateData = await Franchiselist.findOneAndUpdate(filter, update);
    res.send(JSON.stringify({ status: true, message: "User made as Admin!" }));
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err,
    });
  }
});
// LOGINUSER
route.post("/login", async (req, res, next) => {
  let userName = req.body.userName;
  let password = req.body.password;
  let user = {
    username: userName,
    password,
  };
  try {
    let userCheck = await Franchiselist.findOne({ username: userName.trim() });
    console.log(userCheck);
    if (userCheck) {
      if (userCheck.approve == true && userCheck.password == password) {
        const userData = {
          id: userCheck.franchiseID,
          approve: userCheck.approve,
          // Add more user data as needed
        };
        // Generate JWT token with user data
        const token = jwt.sign(userData, "your_secret_key", {
          expiresIn: "2 days",
        });
        res.send(
          JSON.stringify({
            token: token,
            status: true,
            isAdmin: userCheck.isAdmin,
            franchiseState: userCheck.state,
          })
        );
      } else {
        res.send(JSON.stringify({ status: false }));
      }
    } else {
      res.send(JSON.stringify({ status: false, message: "Unapproved Member" }));
    }
  } catch (err) {
    console.log(err);
  }
});
route.post("/login-status", async (req, res, next) => {
  let token = req.body.token;
  jwt.verify(token, "your_secret_key", (err, decoded) => {
    if (err) {
      res.sendStatus(403); // Forbidden
    } else {
      req.user = decoded;
      approve = req.user.approve;
      res.send(JSON.stringify({ status: true, approve: approve }));
      // Attach decoded user data to request object
    }
  });
});
// GENERATE ID
route.post("/generateID", async (req, res, next) => {
  let genID = await newFranchiseID();
  res.send(JSON.stringify({ status: true, data: genID }));
});
// route.post("/check", (req, res) => {
//   console.log(req.body.data[0]);
// });
route.post("/generate-studentid", async (req, res, next) => {
  let userName = req.body.username;
  let currentFranchise = await Franchiselist.find({ username: userName });
  let genID = await newStudentID(
    currentFranchise[0].name,
    currentFranchise[0].state
  );
  res.send(JSON.stringify({ status: true, data: genID.toString() }));
});
// FRANCHISE REGISTRATION
route.post("/franchise-reg", async (req, res, next) => {
  let trimuname = req.body.username;
  let newFranchise = Franchiselist({
    franchiseID: req.body.franchiseID,
    name: req.body.name,
    email: req.body.email,
    contactNumber: req.body.contactNumber,
    state: req.body.state,
    district: req.body.district,
    username: trimuname.trim(),
    password: req.body.password,
    registerDate: req.body.registerDate,
  });
  newFranchise
    .save()
    .then(() => {
      res.status(200).json({
        status: true,
        message: "Franchise added successfully!",
      });
    })
    .catch((error) => {
      res.status(400).json({
        status: false,
        error: error,
      });
    });
});
// GET ALL FRANCHISE
route.post("/getallfranchise", async (req, res) => {
  try {
    let basicQuery = { isAdmin: false };
    let paramQuery = req.query;
    let filter = Object.assign(basicQuery, paramQuery);

    let allFranchise = await Franchiselist.find(filter, { __v: 0 }).sort({
      username: 1,
    });
    if (allFranchise) {
      res.status(200).json({
        status: true,
        data: allFranchise,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});

//APPROVE USER
route.post("/approveUser", async (req, res, next) => {
  let { franchiseID } = req.body;
  try {
    const filter = { franchiseID: franchiseID };
    const update = {
      approve: true,
    };
    let updateData = await Franchiselist.findOneAndUpdate(filter, update);
    res.send(JSON.stringify({ status: true, message: "User approved!" }));
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err,
    });
  }
});
// REJECT USER
route.post("/rejectUser", async (req, res, next) => {
  let { franchiseID } = req.body;
  try {
    const filter = { franchiseID: franchiseID };
    const update = {
      approve: false,
    };

    let updateData = await Franchiselist.findOneAndUpdate(filter, update);
    res.send(JSON.stringify({ status: true, message: "User rejected!" }));
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err,
    });
  }
});
//STUDENT UNPAID REGISTRATION
route.post("/studentcartreg", async (req, res) => {
  let newLevelUpdate = [
    {
      level: req.body.level,
      program: req.body.program,
      date: new Date().toLocaleDateString("en-US"),
      cost: req.body.cost,
      paymentID: req.body.paymentID,
    },
  ];
  let newStudent = StudentCartlist({
    studentID: req.body.studentID,
    enrollDate: new Date(req.body.enrollDate).toISOString().split("T")[0],
    studentName: req.body.studentName,
    address: req.body.address,
    state: req.body.state,
    district: req.body.district,
    mobileNumber: req.body.mobileNumber,
    email: req.body.email,
    fatherName: req.body.fatherName,
    motherName: req.body.motherName,
    franchise: req.body.franchise,
    level: req.body.level,
    items: req.body.items,
    tShirt: req.body.tShirt,
    program: req.body.program,
    cost: req.body.cost,
    paymentID: req.body.paymentID,
    levelOrders: newLevelUpdate,
  });
  newStudent
    .save()
    .then(() => {
      res.status(200).json({
        status: true,
        message: "Added student to cart!",
      });
    })
    .catch((error) => {
      res.status(400).json({
        status: false,
        error: error,
      });
    });
});
route.post("/studentcart-delete", async (req, res) => {
  try {
    await StudentCartlist.findOneAndRemove({
      studentID: req.body.studentID,
    });
    res.status(200).json({
      status: true,
      message: `Student deleted in cart`,
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err,
    });
  }
});
//STUDENT REGISTRATION
route.post("/student-reg", async (req, res) => {
  let newLevelUpdate = [
    {
      level: req.body.level,
      program: req.body.program,
      date: new Date().toLocaleDateString("en-US"),
      cost: req.body.cost,
      paymentID: req.body.paymentID,
    },
  ];
  let newStudent = Studentlist({
    studentID: req.body.studentID,
    enrollDate: new Date(req.body.enrollDate).toISOString().split("T")[0],
    studentName: req.body.studentName,
    address: req.body.address,
    state: req.body.state,
    district: req.body.district,
    mobileNumber: req.body.mobileNumber,
    email: req.body.email,
    fatherName: req.body.fatherName,
    motherName: req.body.motherName,
    franchise: req.body.franchise,
    level: req.body.level,
    items: req.body.items,
    tShirt: req.body.tShirt,
    program: req.body.program,
    cost: req.body.cost,
    paymentID: req.body.paymentID,
    levelOrders: newLevelUpdate,
  });
  newStudent
    .save()
    .then(() => {
      res.status(200).json({
        status: true,
        message: "Student added successfully!",
      });
    })
    .catch((error) => {
      res.status(400).json({
        status: false,
        error: error,
      });
    });
  // UPDATE STOCKS
  try {
    let tshirt = "tshirt" + newStudent.tShirt;
    await Itemlist.updateMany(
      { name: { $in: newStudent.items } },
      { $inc: { count: -1 } }
    );
    console.log(tshirt);
    if (newStudent.tShirt != 0) {
      await Itemlist.updateOne({ name: tshirt }, { $inc: { count: 1 } });
    }
    itemsUpdate();
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err,
    });
  }
  // CREATE TRANSACTION
  let transactions = [];

  newStudent.items.forEach(async (item) => {
    let newTransaction = {
      studentName: newStudent.studentName,
      studentID: newStudent.studentID,
      franchiseName: newStudent.franchise,
      itemName: item,
      quantity: -1,
      currentQuantity: totalItems.find((it) => it.name === item).count,
    };
    transactions.push(newTransaction);
  });
  setTimeout(() => {
    console.log(transactions);
    Transactionlist.insertMany(transactions)
      .then(function () {
        console.log("Transaction inserted");
      })
      .catch(function (error) {
        console.log(error);
      });
  }, 4000);
});

// EDIT STUDENT
route.post("/student-update/:id", async (req, res) => {
  let studentFind;
  var removeFields = [
    "studentID",
    "enrollDate",
    "franchise",
    "levelOrders",
    "cost",
    "paymentID",
    "program",
    "tShirt",
    "items",
  ];
  try {
    const filter = { studentID: req.params.id };
    let updateData = req.body;
    removeFields.forEach((field) => {
      if (updateData[field]) {
        delete updateData[field];
      }
    });
    let updatedData = await Studentlist.findOneAndUpdate(filter, updateData);
    res.send({ status: true, message: "Student updated!" });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: err,
    });
  }
});

//MULTIPLE STUDENT REGISTRATION
route.post("/multiplestudents", async (req, res) => {
  console.log(req.body);
  var razorpayOrderObj = req.body.razorpayOrderObj;
  var isSuccessful = req.body.isSuccessful;
  var order_id, razopayOrderCreatedAt;
  try {
    const razerpayOrder = await RPcreateOrder(razorpayOrderObj);
    if (razerpayOrder.id) {
      res.status(200).send(razerpayOrder.id);
      console.log(razerpayOrder);
      let razorpayOrder = razorpayOrders(razerpayOrder);
      razorpayOrder.notes = { ...razorpayOrder?.notes, ...req.body.data };
      razopayOrderCreatedAt = razorpayOrder.created_at;
      await razorpayOrder.save();
      order_id = razorpayOrder.id;

      if (!isSuccessful) {
        let time = 0;
        while (!isSuccessful || time < 60) {
          let order = await RPcheckStatus(razerpayOrder.id);
          console.log("order Found");
          console.log(order);
          if (order?.status === "paid") {
            razorpayOrder.status = "paid";
            await razorpayOrder.save();
            isSuccessful = true;
            break;
          }
          console.log("Checking payment status");
          console.log(order?.status);
          await new Promise((resolve) => setTimeout(resolve, 5000));
          time++;
        }
      }
    } else {
      res.status(400).send("Error in creating order");
    }
  } catch (err) {
    console.log(err);
  }
  if (isSuccessful) {
    for (let i = 0; i < req.body.data.length; i++) {
      await StudentCartlist.findOneAndRemove({
        studentID: req.body.data[i].studentID,
      });
      const date = new Date(razopayOrderCreatedAt * 1000);
      const formattedDate = date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
      const formattedDateTime = date.toISOString(); // Format date as YYYY-MM-DDTHH:mm:ss.sssZ

      let newLevelUpdate = [
        {
          level: req.body.data[i].level,
          program: req.body.data[i].program,
          date: formattedDateTime,
          cost: req.body.data[i].cost,
          paymentID: order_id,
        },
      ];
      // const date = new Date(razopayOrderCreatedAt * 1000);
      // const formattedDate = `${
      //   date.getMonth() + 1
      // }/${date.getDate()}/${date.getFullYear()}`;

      let newStudent = Studentlist({
        studentID: req.body.data[i].studentID,
        enrollDate: formattedDate,
        studentName: req.body.data[i].studentName,
        address: req.body.data[i].address,
        state: req.body.data[i].state,
        district: req.body.data[i].district,
        mobileNumber: req.body.data[i].mobileNumber,
        email: req.body.data[i].email,
        fatherName: req.body.data[i].fatherName,
        motherName: req.body.data[i].motherName,
        franchise: req.body.data[i].franchise,
        level: req.body.data[i].level,
        items: req.body.data[i].items,
        tShirt: req.body.data[i].tShirt,
        program: req.body.data[i].program,
        cost: req.body.data[i].cost,
        paymentID: order_id,
        levelOrders: newLevelUpdate,
      });
      console.log("newStudent -> ", newStudent);
      newStudent
        .save()
        .then(() => {
          console.log("Added - ", i);
        })
        .catch((error) => {
          console.log(error);
        });
      // UPDATE STOCKS
      try {
        let tshirt = "tshirt" + newStudent.tShirt;
        await Itemlist.updateMany(
          { name: { $in: newStudent.items } },
          { $inc: { count: -1 } }
        );
        console.log(tshirt);
        if (newStudent.tShirt != 0) {
          await Itemlist.updateOne({ name: tshirt }, { $inc: { count: 1 } });
        }
        itemsUpdate();
      } catch (err) {
        console.log(err);
      }
      // CREATE TRANSACTION
      let transactions = [];

      newStudent.items.forEach(async (item) => {
        let newTransaction = {
          studentName: newStudent.studentName,
          studentID: newStudent.studentID,
          franchiseName: newStudent.franchise,
          itemName: item,
          quantity: -1,
          currentQuantity: totalItems.find((it) => it.name === item).count,
        };
        transactions.push(newTransaction);
      });
      setTimeout(() => {
        console.log(transactions);
        Transactionlist.insertMany(transactions)
          .then(function () {
            console.log("Transaction inserted");
          })
          .catch(function (error) {
            console.log(error);
          });
      }, 4000);
    }
    console.log("All students added successfully!");
  }
});

//GET ALL STUDENTS
route.post("/getallstudents", async (req, res) => {
  try {
    let paramQuery = req.query;
    let allStudent = await Studentlist.find(paramQuery, { __v: 0 });
    if (allStudent) {
      res.status(200).json({
        status: true,
        data: allStudent,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});
route.post("/getcartstudents", async (req, res) => {
  try {
    let fusername = req.body.username;
    let allStudent = await StudentCartlist.find(
      { franchise: fusername },
      { __v: 0 }
    );
    if (allStudent) {
      res.status(200).json({
        status: true,
        data: allStudent,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});
//GET Fanchise Registered Students
route.post("/getfranchisestudent", async (req, res, next) => {
  let franchiseUsername = req.body.username;
  try {
    let allStudent = await Studentlist.find(
      { franchise: franchiseUsername },
      { __v: 0 }
    );
    if (allStudent) {
      res.status(200).json({
        status: true,
        data: allStudent,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});
route.post("/addItem", (req, res, next) => {
  let newItem = Itemlist({
    name: req.body.name,
    count: req.body.count,
  });
  newItem
    .save()
    .then(() => {
      res.status(200).json({
        status: true,
        message: "Item added successfully!",
      });
    })
    .catch((error) => {
      res.status(400).json({
        status: false,
        error: error,
      });
    });
});
// GET ALL STOCK
route.post("/getallitems", async (req, res, next) => {
  try {
    let allItem = await Itemlist.find({}, { __v: 0 });
    if (allItem) {
      res.status(200).json({
        status: true,
        data: allItem,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});
// UPDATE STOCK
route.post("/editItem", async (req, res, next) => {
  let id = req.body.id;
  let countReq = req.body.count;
  let itemFind;
  try {
    const filter = { _id: id };
    let updateData = {
      count: countReq,
    };
    itemFind = await Itemlist.find(filter);
    let updatedData = await Itemlist.findOneAndUpdate(filter, updateData);
    itemsUpdate();
    res.send(JSON.stringify({ status: true, message: "Items updated!" }));
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err,
    });
  }
  // CREATE TRANSACTION
  let newTransaction = Transactionlist({
    studentName: "",
    studentID: "",
    franchiseName: "ADMIN",
    itemName: itemFind[0].name,
    quantity: countReq,
    currentQuantity: totalItems.find((it) => it.name === itemFind[0].name)
      .count,
  });
  newTransaction.save();
});
//CREATE ORDERS

route.post("/create-order", async (req, res) => {
  try {
    order = await RPcreateOrder(req.body.razorpayOrderObj);
    if (order) {
      let razorpayOrder = razorpayOrders(order);
      await razorpayOrder.save();
      res.send(order.id);
    } else {
      res.send("Error in creating order");
    }
  } catch (err) {
    console.log(err);
  }
});

route.post("/order", async (req, res) => {
  var isSuccessful = req.body.isSuccessful ?? false;
  const razorpayOrderObj = req.body.razorpayOrderObj;
  console.log(req.body);
  let razorpayOrder;
  console.log(razorpayOrderObj);
  // if isSuccessful is false, then wait for the payment to be successful while checking the paymentID every 5 seconds for 5 minutes
  try {
    const razerpayOrder = await RPcreateOrder(razorpayOrderObj);
    res.send(razerpayOrder.id);
    console.log(razerpayOrder);
    razorpayOrder = razorpayOrders(razerpayOrder);
    await razorpayOrder.save();

    if (!isSuccessful) {
      let time = 0;
      while (!isSuccessful || time < 60) {
        let order = await RPcheckStatus(razerpayOrder.id);
        console.log("order Found");
        console.log(order);
        if (order?.status === "paid") {
          razorpayOrder.status = "paid";
          await razorpayOrder.save();
          isSuccessful = true;
          break;
        }
        console.log("Checking payment status");
        console.log(order?.status);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        time++;
      }
    }
  } catch (err) {
    console.log(err);
    res.send("Error in creating order");
  }
  let razor_createdAt = razorpayOrder.created_at;
  const date = new Date(razor_createdAt * 1000);
  let newLevelUpdate = [
    {
      level: req.body.futureLevel,
      program: req.body.program,
      date: date.toLocaleDateString("en-US"),
      cost: req.body.cost,
      paymentID: razorpayOrder.id,
    },
  ];
  const timeString = date.toLocaleString();
  let reqCertificate = req.body.certificate;
  let newOrder = Orderslist({
    studentID: req.body.studentID,
    currentLevel: req.body.currentLevel,
    futureLevel: req.body.futureLevel,
    items: req.body.items,
    franchise: req.body.franchise,
    enableBtn: req.body.enableBtn,
    transferBool: req.body.transferBool,
    status: isSuccessful ? "Success" : "Pending",
    createdAt: timeString,
    program: req.body.program,
  });
  newOrder
    .save()
    .then(() => {
      // res.status(200).json({
      //   status: true,
      //   message: "Order added successfully!",
      // });
    })
    .catch((error) => {
      res.status(400).json({
        status: false,
        error: error,
      });
    });
  try {
    if (isSuccessful) {
      await Itemlist.updateMany(
        { name: { $in: newOrder.items } },
        { $inc: { count: -1 } }
      );
    }
    itemsUpdate();
  } catch (err) {
    // res.status(400).json({
    //   status: false,
    //   message: err,
    // });
    console.log(err);
  }
  // CHANGE STUDENT LEVEL
  if (isSuccessful) {
    let studentIDReq = req.body.studentID;
    try {
      const filter = { studentID: studentIDReq };
      let updateData = {
        level: newOrder.futureLevel,
      };
      let updatedData = await Studentlist.findOneAndUpdate(filter, {
        level: newOrder.futureLevel,
        program: newOrder.program,
        enableBtn: newOrder.enableBtn,
        transferBool: newOrder.transferBool,
        $push: { levelOrders: newLevelUpdate, certificates: reqCertificate },
      });
      //res.send(JSON.stringify({ status: true, message: "Student updated!" }));
      console.log("Student updated!");
    } catch (err) {
      console.log(err);
    }
  }
});
route.post("/getallorders", async (req, res) => {
  try {
    let allOrders = await Orderslist.find({ status: "Success" }, { __v: 0 });
    if (allOrders) {
      res.status(200).json({
        status: true,
        data: allOrders,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});
//ORDERS FILTER
route.post("/filterorder", async (req, res) => {
  try {
    let { startDate, endDate } = req.body;
    if (startDate === "" || endDate === "") {
      return res.status(400).json({
        status: false,
        message: "Please ensure you pick two dates",
      });
    }
    const orders = await Orderslist.find({
      status: "Success",
      createdAt: {
        $gte: new Date(new Date(startDate).setHours(00, 00, 00)),
        $lt: new Date(new Date(endDate).setHours(23, 59, 59)),
      },
    });
    res.status(201).json({
      status: true,
      data: orders,
    });
  } catch (err) {
    console.log(err);
  }
});
route.post("/getalltransaction", async (req, res) => {
  try {
    let allTransaction = await Transactionlist.find(
      {},
      { __v: 0 },
      { sort: { _id: -1 } }
    );
    if (allTransaction) {
      res.status(200).json({
        status: true,
        data: allTransaction,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});
route.post("/getFilterTransaction", async (req, res, next) => {
  try {
    let { startDate, endDate } = req.body;
    if (startDate === "" || endDate === "") {
      return res.status(400).json({
        status: "failure",
        message: "Please ensure you pick two dates",
      });
    }
    const transactions = await Transactionlist.find({
      createdDate: {
        $gte: new Date(new Date(startDate).setHours(00, 00, 00)),
        $lt: new Date(new Date(endDate).setHours(23, 59, 59)),
      },
    });
    res.status(201).json({
      status: true,
      data: transactions,
    });
  } catch (err) {
    console.log(err);
  }
});
route.post("/getitemtransaction", async (req, res) => {
  let itemNameReq = req.body.name;
  try {
    let allTransaction = await Transactionlist.find(
      { itemName: itemNameReq },
      { __v: 0 }
    );
    if (allTransaction) {
      res.status(200).json({
        status: true,
        data: allTransaction,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});
route.post("/data", async (req, res) => {
  let startDate = req.body.startDate;
  let endDate = req.body.endDate;
  var counts = {};
  var Ordercounts = {};

  let endDt = new Date(endDate).toLocaleDateString("en-US");
  let startDt = new Date(startDate).toLocaleDateString("en-US");
  const data = await Studentlist.aggregate([
    {
      $group: { _id: "$franchise", stock: { $push: "$$ROOT" } },
    },
    {
      $project: {
        stock: {
          items: 1,
          studentName: 1,
          state: 1,
          level: 1,
          district: 1,
          enrollDate: 1,
          tShirt: 1,
        },
      },
    },
  ]);
  console.log(data);
  let out = [];
  for (var i = 0; i < data.length; i++) {
    let oneOut = {
      franchiseName: data[i]["_id"],
      count: {},
      enrolledStudents: [],
    };
    let tShirtArr = [];

    let onlyItems = [];

    data[i].stock.forEach(function (elem) {
      let currentDt = new Date(elem.enrollDate).toLocaleDateString("en-US");
      if (new Date(currentDt) > new Date(endDt)) {
        return;
      }
      if (new Date(currentDt) < new Date(startDt)) {
        return;
      }
      onlyItems.push(elem.items);
      let enrollStu = {
        studentName: elem.studentName,
        state: elem.state,
        level: elem.level,
        district: elem.district,
        enrollDate: elem.enrollDate,
      };
      oneOut.enrolledStudents.push(enrollStu);
      tShirtArr.push("Tshirt-" + elem.tShirt);
    });
    const tShirtObj = tShirtArr.reduce((acc, currentValue) => {
      acc[currentValue] = (acc[currentValue] || 0) + 1;
      return acc;
    }, {});
    oneOut.tShirtObj = tShirtObj;
    onlyItems = onlyItems.flat();
    for (const num of onlyItems) {
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    oneOut.count = counts;
    counts = {};
    out.push(oneOut);
  }
  console.log(out);
  let orderData = await Orderslist.aggregate([
    // {
    //   $match: { status: "Success" },
    // },
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate).toLocaleDateString("en-US"),
        },
        status: "Success",
      },
    },
    {
      $group: { _id: "$franchise", orders: { $push: "$$ROOT" } },
    },
    {
      $project: {
        orders: {
          studentID: 1,
          futureLevel: 1,
          items: 1,
          currentLevel: 1,
          createdAt: 1,
        },
      },
    },
  ]);
  console.log("orderDATA - ", orderData);
  let studentNameData = await getstudentInfo();
  let orderOut = [];
  for (var i = 0; i < orderData.length; i++) {
    let oneOrderOut = {
      franchiseName: orderData[i]._id,
      ordered: [],
      orderCounts: {},
    };

    let onlyItems = [];
    orderData[i].orders.forEach(function (elem) {
      let currentDt = new Date(elem.createdAt)
        .toLocaleString("en-US")
        .split(",")[0];
      if (new Date(currentDt) > new Date(endDt)) {
        return;
      }
      if (new Date(currentDt) < new Date(startDt)) {
        return;
      }
      onlyItems.push(elem.items);
      let stuData = studentNameData.filter(function (item) {
        return item.studentID === elem.studentID;
      });
      console.log("StudentData  =  ", stuData, "elem ", elem);
      let newOrd;
      if (stuData) {
        newOrd = {
          studentName: stuData[0].studentName,
          studentID: elem.studentID,
          state: stuData[0].state,
          currentLevel: elem.currentLevel,
          futureLevel: elem.futureLevel,
          district: stuData[0].district,
          createdAt: elem.createdAt.split(",")[0],
        };
        oneOrderOut.ordered.push(newOrd);
      }
    });
    onlyItems = onlyItems.flat();
    for (const num of onlyItems) {
      Ordercounts[num] = Ordercounts[num] ? Ordercounts[num] + 1 : 1;
    }
    oneOrderOut.orderCounts = Ordercounts;
    Ordercounts = {};
    orderOut.push(oneOrderOut);
  }
  const map = new Map();
  out.forEach((item) => map.set(item.franchiseName, item));
  orderOut.forEach((item) =>
    map.set(item.franchiseName, { ...map.get(item.franchiseName), ...item })
  );
  const mergedArr = Array.from(map.values());

  for (i = 0; i < mergedArr.length; i++) {
    var totalItems = {};
    for (var key in mergedArr[i].count) {
      totalItems[key] = mergedArr[i].count[key];
    }
    for (var key in mergedArr[i].orderCounts) {
      if (totalItems[key]) {
        totalItems[key] =
          mergedArr[i].orderCounts[key] + mergedArr[i].count[key];
      } else {
        totalItems[key] = mergedArr[i].orderCounts[key];
      }
    }
    // mergedArr[i]["totalItems"] = totalItems;
    mergedArr[i]["totalItems"] = { ...totalItems, ...mergedArr[i].tShirtObj };
    console.log(
      "totalItems - ",
      Object.keys(mergedArr[i]["totalItems"]).length
    );
    if (
      Object.keys(mergedArr[i]["totalItems"]).length === 0 &&
      mergedArr[i]["enrolledStudents"]
    ) {
      if (mergedArr[i]["enrolledStudents"].length == 0) {
        delete mergedArr[i];
      }
    } else {
      delete mergedArr[i]["count"];
      delete mergedArr[i]["orderCounts"];
    }
  }
  const filteredmergedArr = mergedArr.filter((object) => object !== null);
  if (mergedArr) {
    res.status(200).json({
      status: true,
      data: filteredmergedArr,
    });
  }
});
route.post("/tamilnadureport", async (req, res) => {
  let startDate = req.body.startDate;
  let endDate = req.body.endDate;
  var counts = {};
  var Ordercounts = {};

  let endDt = new Date(endDate).toLocaleDateString("en-US");
  let startDt = new Date(startDate).toLocaleDateString("en-US");
  const data = await Studentlist.aggregate([
    {
      $group: { _id: "$franchise", stock: { $push: "$$ROOT" } },
    },
    {
      $project: {
        stock: {
          items: 1,
          studentName: 1,
          state: 1,
          level: 1,
          district: 1,
          enrollDate: 1,
          tShirt: 1,
        },
      },
    },
  ]);
  console.log(data);
  let out = [];
  for (var i = 0; i < data.length; i++) {
    let oneOut = {
      franchiseName: data[i]["_id"],
      count: {},
      enrolledStudents: [],
    };
    let tShirtArr = [];

    let onlyItems = [];
    data[i].stock.forEach(function (elem) {
      let currentDt = new Date(elem.enrollDate).toLocaleDateString("en-US");
      if (new Date(currentDt) > new Date(endDt)) {
        return;
      }
      if (new Date(currentDt) < new Date(startDt)) {
        return;
      }
      onlyItems.push(elem.items);
      let enrollStu = {
        studentName: elem.studentName,
        state: elem.state,
        level: elem.level,
        district: elem.district,
        enrollDate: elem.enrollDate,
      };
      oneOut.enrolledStudents.push(enrollStu);
      tShirtArr.push("Tshirt-" + elem.tShirt);
    });
    const tShirtObj = tShirtArr.reduce((acc, currentValue) => {
      acc[currentValue] = (acc[currentValue] || 0) + 1;
      return acc;
    }, {});
    oneOut.tShirtObj = tShirtObj;
    onlyItems = onlyItems.flat();
    for (const num of onlyItems) {
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    oneOut.count = counts;
    counts = {};
    out.push(oneOut);
  }
  console.log(out);
  let orderData = await Orderslist.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate).toLocaleDateString("en-US"),
        },
        status: "Success",
      },
    },
    {
      $group: { _id: "$franchise", orders: { $push: "$$ROOT" } },
    },
    {
      $project: {
        orders: {
          studentID: 1,
          futureLevel: 1,
          items: 1,
          currentLevel: 1,
          createdAt: 1,
        },
      },
    },
  ]);
  console.log("orderDATA - ", orderData);
  let studentNameData = await getstudentInfo();
  let orderOut = [];
  for (var i = 0; i < orderData.length; i++) {
    let oneOrderOut = {
      franchiseName: orderData[i]._id,
      ordered: [],
      orderCounts: {},
    };

    let onlyItems = [];
    orderData[i].orders.forEach(function (elem) {
      let currentDt = new Date(elem.createdAt)
        .toLocaleDateString("en-US")
        .split(",")[0];
      if (new Date(currentDt) > new Date(endDt)) {
        return;
      }
      if (new Date(currentDt) < new Date(startDt)) {
        return;
      }
      onlyItems.push(elem.items);
      let stuData = studentNameData.filter(function (item) {
        return item.studentID === elem.studentID;
      });
      console.log("StudentData  =  ", stuData, "elem ", elem);
      let newOrd;
      if (stuData) {
        newOrd = {
          studentName: stuData[0].studentName,
          studentID: elem.studentID,
          state: stuData[0].state,
          currentLevel: elem.currentLevel,
          futureLevel: elem.futureLevel,
          district: stuData[0].district,
          createdAt: elem.createdAt.split(",")[0],
        };
        oneOrderOut.ordered.push(newOrd);
      }
    });
    onlyItems = onlyItems.flat();
    for (const num of onlyItems) {
      Ordercounts[num] = Ordercounts[num] ? Ordercounts[num] + 1 : 1;
    }
    oneOrderOut.orderCounts = Ordercounts;
    Ordercounts = {};
    orderOut.push(oneOrderOut);
  }
  const map = new Map();
  out.forEach((item) => map.set(item.franchiseName, item));
  orderOut.forEach((item) =>
    map.set(item.franchiseName, { ...map.get(item.franchiseName), ...item })
  );
  const mergedArr = Array.from(map.values());

  for (i = 0; i < mergedArr.length; i++) {
    var totalItems = {};
    for (var key in mergedArr[i].count) {
      totalItems[key] = mergedArr[i].count[key];
    }
    for (var key in mergedArr[i].orderCounts) {
      if (totalItems[key]) {
        totalItems[key] =
          mergedArr[i].orderCounts[key] + mergedArr[i].count[key];
      } else {
        totalItems[key] = mergedArr[i].orderCounts[key];
      }
    }
    // mergedArr[i]["totalItems"] = totalItems;
    mergedArr[i]["totalItems"] = { ...totalItems, ...mergedArr[i].tShirtObj };
    if (
      Object.keys(mergedArr[i]["totalItems"]).length === 0 &&
      mergedArr[i]["enrolledStudents"]
    ) {
      if (mergedArr[i]["enrolledStudents"].length == 0) {
        delete mergedArr[i];
      }
    } else {
      delete mergedArr[i]["count"];
      delete mergedArr[i]["orderCounts"];
    }
  }
  const filteredmergedArr = mergedArr.filter((object) => object !== null);
  let updatedfilteredmergedArr = [];
  var promises = filteredmergedArr.map(function (elem) {
    return Franchiselist.find(
      { username: elem.franchiseName },
      { state: 1 }
    ).then((items) => {
      if (items.length > 0 && items[0].state === "Tamil Nadu") {
        return elem;
      } else {
        return null; // or any value indicating the element is filtered out
      }
    });
  });

  Promise.all(promises)
    .then((results) => {
      // Filter out null values (elements that were filtered out)
      var filteredResults = results.filter((result) => result !== null);
      res.status(200).json({
        status: true,
        data: filteredResults,
      });
    })
    .catch((error) => {
      // Handle errors
      console.error(error);
      res.status(500).json({ status: false, message: "Internal server error" });
    });
});
route.post("/dataperiod", async (req, res) => {
  var counts = {};
  var Ordercounts = {};
  let startDate = req.body.startDate;
  let endDate = req.body.endDate;
  // let franchiseName = req.body.franchise;
  const data = await Studentlist.aggregate([
    {
      $match: { enrollDate: date },
    },
    {
      $group: { _id: "$franchise", stock: { $push: "$$ROOT" } },
    },
    {
      $project: {
        stock: {
          items: 1,
          studentName: 1,
          state: 1,
          level: 1,
          district: 1,
        },
      },
    },
  ]);
  let out = [];
  for (var i = 0; i < data.length; i++) {
    let oneOut = {
      franchiseName: data[i]["_id"],
      count: {},
      enrolledStudents: [],
    };

    let onlyItems = [];
    data[i].stock.forEach(function (elem) {
      onlyItems.push(elem.items);
      let enrollStu = {
        studentName: elem.studentName,
        state: elem.state,
        level: elem.level,
        district: elem.district,
      };
      oneOut.enrolledStudents.push(enrollStu);
    });
    onlyItems = onlyItems.flat();
    for (const num of onlyItems) {
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    oneOut.count = counts;
    counts = {};
    out.push(oneOut);
  }
  console.log(out);
  let orderData = await Orderslist.aggregate([
    {
      $match: {
        createdAt: new Date(date).toLocaleDateString("en-US"),
        status: "Success",
      },
    },
    {
      $group: { _id: "$franchise", orders: { $push: "$$ROOT" } },
    },
    {
      $project: {
        orders: {
          studentID: 1,
          futureLevel: 1,
          items: 1,
          currentLevel: 1,
        },
      },
    },
  ]);
  console.log("orderDATA - ", orderData);
  let studentNameData = await getstudentInfo();
  let orderOut = [];
  for (var i = 0; i < orderData.length; i++) {
    let oneOrderOut = {
      franchiseName: orderData[i]._id,
      ordered: [],
      orderCounts: {},
    };
    let onlyItems = [];
    orderData[i].orders.forEach(function (elem) {
      onlyItems.push(elem.items);
      let stuData = studentNameData.filter(function (item) {
        return item.studentID === elem.studentID;
      });
      let newOrd = {
        studentName: stuData[0].studentName,
        studentID: elem.studentID,
        state: stuData[0].state,
        currentLevel: elem.currentLevel,
        futureLevel: elem.futureLevel,
        district: stuData[0].district,
      };
      oneOrderOut.ordered.push(newOrd);
    });
    onlyItems = onlyItems.flat();
    for (const num of onlyItems) {
      Ordercounts[num] = Ordercounts[num] ? Ordercounts[num] + 1 : 1;
    }
    oneOrderOut.orderCounts = Ordercounts;
    Ordercounts = {};
    orderOut.push(oneOrderOut);
  }
  const map = new Map();
  out.forEach((item) => map.set(item.franchiseName, item));
  orderOut.forEach((item) =>
    map.set(item.franchiseName, { ...map.get(item.franchiseName), ...item })
  );
  const mergedArr = Array.from(map.values());
  let kirr = mergedArr;
  for (i = 0; i < mergedArr.length; i++) {
    var totalItems = {};
    for (var key in mergedArr[i].count) {
      totalItems[key] = mergedArr[i].count[key];
    }
    for (var key in mergedArr[i].orderCounts) {
      if (totalItems[key]) {
        totalItems[key] =
          mergedArr[i].orderCounts[key] + mergedArr[i].count[key];
      } else {
        totalItems[key] = mergedArr[i].orderCounts[key];
      }
    }
    mergedArr[i]["totalItems"] = totalItems;
    delete mergedArr[i]["count"];
    delete mergedArr[i]["orderCounts"];
  }

  if (mergedArr) {
    res.status(200).json({
      status: true,
      data: mergedArr,
    });
  }
});
route.post("/getStudentsCount", async (req, res) => {
  try {
    let basicQuery = { isAdmin: false };
    let paramQuery = req.query;
    let filter = Object.assign(basicQuery, paramQuery);
    let allFranchise = await Franchiselist.find(filter, { __v: 0 }).sort({
      username: 1,
    });
    const aggregationPipeline = [
      {
        $group: {
          _id: "$franchise",
          numberOfStudents: { $sum: 1 },
        },
      },
    ];

    // Execute the aggregation pipeline
    const result = await Studentlist.aggregate(aggregationPipeline);
    const combinedJson = allFranchise.map((item2) => {
      const matchingItem1 = result.find((item1) => item1._id === item2.email);
      if (matchingItem1) {
        return {
          _id: item2._id,
          franchiseID: item2.franchiseID,
          name: item2.name,
          email: item2.email,
          contactNumber: item2.contactNumber,
          state: item2.state,
          district: item2.district,
          username: item2.username,
          password: item2.password,
          registerDate: item2.registerDate,
          isAdmin: item2.isAdmin,
          approve: item2.approve,
          numberOfStudents: matchingItem1.numberOfStudents,
        };
      }
      return item2;
    });
    if (result) {
      res.status(200).json({
        status: true,
        data1: combinedJson,
      });
    } else {
      res.status(200).json({
        status: true,
        data2: allFranchise,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: false,
      message: "DB error",
    });
  }
});
// HELPER FUNCTIONS
async function getstudentInfo() {
  let studentData = await Studentlist.find(
    {},
    { studentName: 1, state: 1, studentID: 1, district: 1 }
  );
  return studentData;
}
async function generateID() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetter1 = alphabet[Math.floor(Math.random() * alphabet.length)];
  const randomLetter2 = alphabet[Math.floor(Math.random() * alphabet.length)];
  let randomNumbers = Math.round(Math.random() * 10000);
  let genID = randomLetter1 + randomLetter2 + randomNumbers;
  let franchiseList = await Franchiselist.find({ franchiseID: genID });
  if (franchiseList) {
    generateID();
  }
  return genID;
}
var franchiseExist = 0;
async function newFranchiseID() {
  let franchises = await Franchiselist.find({});
  let franchiseCount = franchises.length + franchiseExist;
  let newID = "AF0000" + franchiseCount;
  let newFranchiseIDFind = await Franchiselist.find({ franchiseID: newID });
  if (newFranchiseIDFind.length > 0) {
    franchiseExist = franchiseExist + 1;
    return newFranchiseID();
  }
  franchiseExist = 0;
  return newID;
}
var exist = 0;
async function newStudentID(stateName, franchiseName) {
  console.log(stateName);
  console.log(franchiseName);
  let studentsList = await Studentlist.find({});
  let studentsCartList = await StudentCartlist.find({});
  let studentsCount = studentsList.length + studentsCartList.length + 1 + exist;
  let studentID =
    stateName.toUpperCase().slice(0, 2) +
    franchiseName.toUpperCase().slice(0, 2) +
    "0000" +
    studentsCount;
  let newStudentIDFind = await Studentlist.find({ studentID: studentID });
  if (newStudentIDFind.length > 0) {
    exist = exist + 1;
    return newStudentID(stateName, franchiseName);
  }
  exist = 0;
  return studentID;
}
async function generateStudentID() {
  let studentsList = await Studentlist.find({});
  if (studentsList) {
    return studentsList.length + 1;
  }
}
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.sendStatus(403);
  }
}

module.exports = route;
