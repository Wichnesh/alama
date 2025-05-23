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
// const mongoose = require("mongoose");
// const studentsCart = require("../models/studentsCart");
const { RPcreateOrder, RPcheckStatus } = require("../utils/razorpayApis");
const { format } = require("path");

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
  try {
    let userCheck = await Franchiselist.findOne({ username: userName.trim() });
    if (userCheck) {
      if (userCheck.approve == true && userCheck.password == password) {
        const userData = {
          id: userCheck.franchiseID,
          approve: userCheck.approve,
          // Add more user data as needed
        };
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
  let registerDate = new Date(req.body.registerDate);
  if (isNaN(registerDate.getTime())) {
    return res.status(400).json({
      status: false,
      message: "Invalid date format",
    });
  }
  let newFranchise = Franchiselist({
    franchiseID: req.body.franchiseID,
    name: req.body.name,
    email: req.body.email,
    contactNumber: req.body.contactNumber,
    state: req.body.state,
    district: req.body.district,
    username: trimuname.trim(),
    password: req.body.password,
    registerDate: registerDate.toISOString(),
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
      date: new Date().toISOString(),
      cost: req.body.cost,
      paymentID: req.body.paymentID,
    },
  ];
  let newStudent = StudentCartlist({
    studentID: req.body.studentID,
    enrollDate: new Date(req.body.enrollDate).toISOString(),
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
      date: new Date().toISOString(),
      cost: req.body.cost,
      paymentID: req.body.paymentID,
    },
  ];
  let newStudent = Studentlist({
    studentID: req.body.studentID,
    enrollDate: new Date(req.body.enrollDate).toISOString(),
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
      const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
      const istDate = new Date(date.getTime() + istOffset);

      // Format to ISO 8601 with IST offset (+05:30)
      const istFormattedDateTime = istDate.toISOString().replace("Z", "+05:30");
      let newLevelUpdate = [
        {
          level: req.body.data[i].level,
          program: req.body.data[i].program,
          date: istFormattedDateTime,
          cost: req.body.data[i].cost,
          paymentID: order_id,
        },
      ];
      let newStudent = Studentlist({
        studentID: req.body.data[i].studentID,
        enrollDate: istFormattedDateTime,
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

    allStudent = allStudent.map((student) => {
      student.levelOrders = student.levelOrders.map((order) => {
        order.date = new Date(order.date).toISOString();
        return order;
      });
      return student;
    });

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
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istDate = new Date(date.getTime() + istOffset);
  // Format to ISO 8601 with IST offset (+05:30)
  const istFormattedDateTime = istDate.toISOString().replace("Z", "+05:30");
  let newLevelUpdate = [
    {
      level: req.body.futureLevel,
      program: req.body.program,
      date: istFormattedDateTime,
      cost: req.body.cost,
      paymentID: razorpayOrder.id,
    },
  ];
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
    createdAt: istFormattedDateTime,
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
// route.post("/data", async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;
//     const startDt = new Date(startDate).toISOString();
//     const endDt = new Date(
//       new Date(endDate).setDate(new Date(endDate).getDate() + 1)
//     ).toISOString();

//     const studentData = await getStudentData(startDt, endDt);
//     const orderData = await getOrderData(startDt, endDt);
//     const studentNameData = await getstudentInfo();

//     const mergedData = mergeData(
//       studentData,
//       orderData,
//       studentNameData,
//       startDt,
//       endDt
//     );

//     res.status(200).json({
//       status: true,
//       data: mergedData,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// });

// Function to convert date string to 'YYYY-MM-DD' format
function convertDateFormat(dateStr) {
  const [month, day, year] = dateStr.split("/"); // Split the string by "/"
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`; // Return in YYYY-MM-DD format
}
route.post("/data", async (req, res) => {
  try {
    // let formattedStart = convertDateFormat(req.body.startDate);
    // let formattedEnd = convertDateFormat(req.body.endDate);
    // let { startDt, endDt } = toISTDateRange(formattedStart, formattedEnd);

    // console.log("Start Date:", startDt); // Should print the IST start date
    // console.log("End Date:", endDt); // Should print the IST end date
    // if (!startDt || !endDt) {
    //   return res
    //     .status(400)
    //     .json({ status: false, message: "Invalid date format received" });
    // }
    startDt = convertDateFormat(req.body.startDate) + "T00:00:00.000+05:30";
    endDt = convertDateFormat(req.body.endDate) + "T23:59:59.000+05:30";
    // Step 1: Get student data (enrollDate is a string)
    const studentData = await Studentlist.aggregate([
      {
        $match: {
          enrollDate: { $gte: startDt, $lt: endDt },
        },
      },
      {
        $group: {
          _id: "$franchise",
          enrolledStudents: {
            $push: {
              studentName: "$studentName",
              state: "$state",
              level: "$level",
              district: "$district",
              enrollDate: "$enrollDate",
            },
          },
          tShirts: { $push: "$tShirt" },
          itemsList: { $push: "$items" },
        },
      },
      {
        $project: {
          franchiseName: "$_id",
          enrolledStudents: 1,
          tShirts: 1,
          itemsList: 1,
        },
      },
    ]);

    // Step 2: Get order data (createdAt is a string)
    const orderData = await Orderslist.aggregate([
      {
        $match: {
          status: "Success",
          createdAt: { $gte: startDt, $lt: endDt },
        },
      },
      {
        $lookup: {
          from: "studentlists",
          localField: "studentID",
          foreignField: "studentID",
          as: "studentDetails",
        },
      },
      { $unwind: "$studentDetails" },
      {
        $group: {
          _id: "$franchise",
          ordered: {
            $push: {
              studentName: "$studentDetails.studentName",
              studentID: "$studentID",
              state: "$studentDetails.state",
              currentLevel: "$currentLevel",
              futureLevel: "$futureLevel",
              district: "$studentDetails.district",
              createdAt: "$createdAt",
            },
          },
          itemsList: { $push: "$items" },
        },
      },
      {
        $project: {
          ordered: 1,
          itemsList: 1,
        },
      },
    ]);

    // Step 3: Merge results
    const map = new Map();

    studentData.forEach((entry) => {
      const tShirtObj = entry.tShirts.reduce((acc, size) => {
        const label = "Tshirt-" + size;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});

      const count = entry.itemsList.flat().reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {});

      map.set(entry.franchiseName, {
        franchiseName: entry.franchiseName,
        enrolledStudents: entry.enrolledStudents,
        tShirtObj,
        count,
      });
    });

    orderData.forEach((entry) => {
      const orderCounts = entry.itemsList.flat().reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {});

      const existing = map.get(entry._id) || {
        franchiseName: entry._id,
        enrolledStudents: [],
        tShirtObj: {},
        count: {},
      };

      map.set(entry._id, {
        ...existing,
        ordered: entry.ordered,
        orderCounts,
      });
    });

    const mergedData = Array.from(map.values())
      .map((item) => {
        const totalItems = {
          ...item.count,
          ...item.orderCounts,
          ...item.tShirtObj,
        };

        return {
          franchiseName: item.franchiseName,
          enrolledStudents: item.enrolledStudents || [],
          ordered: item.ordered || [],
          tShirtObj: item.tShirtObj || {},
          totalItems,
        };
      })
      .filter(
        (item) =>
          item.enrolledStudents.length > 0 ||
          Object.keys(item.totalItems).length > 0
      );

    res.status(200).json({ status: true, data: mergedData });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

async function getStudentData(startDt, endDt) {
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

  return data.map((franchise) => {
    const enrolledStudents = [];
    const tShirtArr = [];
    const onlyItems = [];

    franchise.stock.forEach((elem) => {
      const currentDt = new Date(elem.enrollDate).toISOString();
      if (
        new Date(currentDt) >= new Date(endDt) ||
        new Date(currentDt) < new Date(startDt)
      ) {
        return;
      }
      onlyItems.push(elem.items);
      enrolledStudents.push({
        studentName: elem.studentName,
        state: elem.state,
        level: elem.level,
        district: elem.district,
        enrollDate: elem.enrollDate,
      });
      tShirtArr.push("Tshirt-" + elem.tShirt);
    });

    const tShirtObj = tShirtArr.reduce((acc, currentValue) => {
      acc[currentValue] = (acc[currentValue] || 0) + 1;
      return acc;
    }, {});

    const count = onlyItems.flat().reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    return {
      franchiseName: franchise._id,
      count,
      enrolledStudents,
      tShirtObj,
    };
  });
}

async function getOrderData(startDt, endDt) {
  return await Orderslist.aggregate([
    {
      $addFields: {
        createdAtDate: {
          $dateFromString: {
            dateString: "$createdAt",
          },
        },
      },
    },
    {
      $match: {
        createdAtDate: {
          $gte: new Date(startDt),
          $lt: new Date(endDt),
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
}

function mergeData(studentData, orderData, studentNameData, startDt, endDt) {
  const map = new Map();

  studentData.forEach((item) => map.set(item.franchiseName, item));

  orderData.forEach((franchise) => {
    const ordered = [];
    const orderCounts = {};
    const onlyItems = [];

    franchise.orders.forEach((elem) => {
      const currentDt = new Date(elem.createdAt).toISOString();
      if (
        new Date(currentDt) > new Date(endDt) ||
        new Date(currentDt) < new Date(startDt)
      ) {
        return;
      }
      onlyItems.push(elem.items);
      const stuData = studentNameData.find(
        (item) => item.studentID === elem.studentID
      );
      if (stuData) {
        ordered.push({
          studentName: stuData.studentName,
          studentID: elem.studentID,
          state: stuData.state,
          currentLevel: elem.currentLevel,
          futureLevel: elem.futureLevel,
          district: stuData.district,
          createdAt: elem.createdAt,
        });
      }
    });

    onlyItems.flat().forEach((item) => {
      orderCounts[item] = (orderCounts[item] || 0) + 1;
    });

    map.set(franchise._id, {
      ...map.get(franchise._id),
      ordered,
      orderCounts,
    });
  });

  return Array.from(map.values())
    .map((item) => {
      const totalItems = {
        ...item.count,
        ...item.orderCounts,
        ...item.tShirtObj,
      };
      return {
        ...item,
        totalItems,
        count: undefined,
        orderCounts: undefined,
      };
    })
    .filter(
      (item) =>
        item.enrolledStudents.length > 0 ||
        Object.keys(item.totalItems).length > 0
    );
}
route.post("/tamilnadureport", async (req, res) => {
  try {
    startDt = convertDateFormat(req.body.startDate) + "T00:00:00.000+05:30";
    endDt = convertDateFormat(req.body.endDate) + "T23:59:59.000+05:30";

    const studentData = await getStudentData(startDt, endDt);
    const orderData = await getOrderData(startDt, endDt);
    const studentNameData = await getstudentInfo();

    const mergedData = mergeData(
      studentData,
      orderData,
      studentNameData,
      startDt,
      endDt
    );

    const tamilNaduData = await filterTamilNaduFranchises(mergedData);

    res.status(200).json({
      status: true,
      data: tamilNaduData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

async function filterTamilNaduFranchises(data) {
  const tamilNaduFranchises = await Franchiselist.find(
    { state: "Tamil Nadu" },
    { username: 1 }
  );
  const tamilNaduFranchiseNames = tamilNaduFranchises.map(
    (franchise) => franchise.username
  );

  return data.filter((item) =>
    tamilNaduFranchiseNames.includes(item.franchiseName)
  );
}
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
        createdAt: new Date(date).toISOString(),
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
