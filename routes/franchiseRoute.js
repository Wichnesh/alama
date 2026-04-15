var express = require("express");
var route = express.Router();
const FranchisePhoneList = require("../models/franchisePhoneList");
const StudentResponse = require("../models/studentResponse");
const Franchiselist = require("../models/franchise");
const axios = require("axios");

// ============================================
// FRANCHISE APIs
// ============================================

// 1. ADD PHONE NUMBER TO FRANCHISE LIST
route.post("/franchise/add-phone", async (req, res) => {
  try {
    const { franchiseID, phoneNumber, name } = req.body;

    if (!franchiseID || !phoneNumber) {
      return res.status(400).json({
        status: false,
        message: "franchiseID and phoneNumber are required",
      });
    }

    // Check if franchise exists
    const franchise = await Franchiselist.findOne({ franchiseID });
    if (!franchise) {
      return res.status(404).json({
        status: false,
        message: "Franchise not found",
      });
    }

    // Check if phone already exists for this franchise
    const existingPhone = await FranchisePhoneList.findOne({
      franchiseID,
      phoneNumber,
    });
    if (existingPhone) {
      return res.status(400).json({
        status: false,
        message: "Phone number already exists for this franchise",
      });
    }

    // Add phone number
    const newPhoneEntry = new FranchisePhoneList({
      franchiseID,
      phoneNumber,
      name: name || null,
    });

    await newPhoneEntry.save();

    res.json({
      status: true,
      message: "Phone number added successfully",
      data: newPhoneEntry,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// 2. GET ALL PHONE NUMBERS FOR A FRANCHISE
route.get("/franchise/:franchiseID/phone-list", async (req, res) => {
  try {
    const { franchiseID } = req.params;

    const phoneList = await FranchisePhoneList.find({ franchiseID }).sort({
      createdAt: -1,
    });

    res.json({
      status: true,
      data: phoneList,
      count: phoneList.length,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// 3. DELETE PHONE NUMBER
route.delete("/franchise/phone/:phoneID", async (req, res) => {
  try {
    const { phoneID } = req.params;

    const deleted = await FranchisePhoneList.findByIdAndDelete(phoneID);

    if (!deleted) {
      return res.status(404).json({
        status: false,
        message: "Phone entry not found",
      });
    }

    res.json({
      status: true,
      message: "Phone number deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// 4. SEND WHATSAPP MESSAGE WITH UNIQUE LINK
route.post("/franchise/send-whatsapp", async (req, res) => {
  try {
    const { franchiseID, phoneNumbers } = req.body;

    if (!franchiseID || !phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        status: false,
        message: "franchiseID and phoneNumbers array are required",
      });
    }

    // Validate franchise
    const franchise = await Franchiselist.findOne({ franchiseID });
    if (!franchise) {
      return res.status(404).json({
        status: false,
        message: "Franchise not found",
      });
    }

    const results = [];

    for (const phoneNumber of phoneNumbers) {
      try {
        // Generate unique link for this franchise
        const uniqueLink = `${process.env.FRONTEND_URL || "http://localhost:3001"}/submit-form?franchise=${franchiseID}&phone=${encodeURIComponent(phoneNumber)}`;

        // Prepare WhatsApp message
        const message = `Hello! 👋\n\nWe'd love to hear from you about our programs. Please fill out this quick form:\n\n${uniqueLink}\n\nThank you!`;

        // Format phone number for WhatsApp (assuming Indian format, remove leading 0 if exists)
        const formattedPhone = phoneNumber.startsWith("0") 
          ? "91" + phoneNumber.substring(1) 
          : "91" + phoneNumber;

        // Send WhatsApp message (using Twilio, MessageBird, or your preferred API)
        // Example using a generic WhatsApp API endpoint
        const whatsappResponse = await sendWhatsAppMessage(formattedPhone, message);

        results.push({
          phoneNumber,
          status: "sent",
          link: uniqueLink,
          whatsappStatus: whatsappResponse.status,
        });
      } catch (err) {
        results.push({
          phoneNumber,
          status: "failed",
          error: err.message,
        });
      }
    }

    res.json({
      status: true,
      message: "WhatsApp messages processed",
      results,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// 5. GET ALL STUDENT RESPONSES FOR A FRANCHISE
route.get("/franchise/:franchiseID/responses", async (req, res) => {
  try {
    const { franchiseID } = req.params;

    const responses = await StudentResponse.find({ franchiseID }).sort({
      submittedAt: -1,
    });

    // Separate interested and not interested
    const interested = responses.filter((r) => r.interested);
    const notInterested = responses.filter((r) => !r.interested);

    res.json({
      status: true,
      data: {
        all: responses,
        interested,
        notInterested,
        counts: {
          total: responses.length,
          interested: interested.length,
          notInterested: notInterested.length,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// ============================================
// STUDENT APIs (PUBLIC)
// ============================================

// 6. CHECK IF PHONE ALREADY SUBMITTED
route.get("/student/check-phone", async (req, res) => {
  try {
    const { phoneNumber, franchiseID } = req.query;

    if (!phoneNumber || !franchiseID) {
      return res.status(400).json({
        status: false,
        message: "phoneNumber and franchiseID are required",
      });
    }

    const existing = await StudentResponse.findOne({
      phoneNumber,
      franchiseID,
    });

    res.json({
      status: true,
      alreadySubmitted: !!existing,
      message: existing ? "This phone number has already submitted" : "Phone number is valid",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// 7. SUBMIT STUDENT FORM
route.post("/student/submit-form", async (req, res) => {
  try {
    const { phoneNumber, franchiseID, studentName, city, state, interested } =
      req.body;

    if (
      !phoneNumber ||
      !franchiseID ||
      !studentName ||
      !city ||
      !state ||
      interested === undefined
    ) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    // Check if already submitted
    const existing = await StudentResponse.findOne({
      phoneNumber,
      franchiseID,
    });

    if (existing) {
      return res.status(400).json({
        status: false,
        message: "This phone number has already submitted a response",
      });
    }

    // Create new response
    const newResponse = new StudentResponse({
      phoneNumber,
      franchiseID,
      studentName,
      city,
      state,
      interested,
    });

    await newResponse.save();

    res.json({
      status: true,
      message: "Form submitted successfully",
      data: newResponse,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// ============================================
// ADMIN APIs
// ============================================

// 8. GET ALL STUDENT RESPONSES (ADMIN)
route.get("/admin/all-responses", async (req, res) => {
  try {
    const responses = await StudentResponse.find({})
      .sort({ submittedAt: -1 })
      .populate("franchiseID");

    const stats = {
      total: responses.length,
      interested: responses.filter((r) => r.interested).length,
      notInterested: responses.filter((r) => !r.interested).length,
      assigned: responses.filter((r) => r.assignedToFranchiseID).length,
    };

    res.json({
      status: true,
      data: responses,
      stats,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// 9. ASSIGN STUDENT TO FRANCHISE (ADMIN)
route.post("/admin/assign-student", async (req, res) => {
  try {
    const { responseID, assignToFranchiseID } = req.body;

    if (!responseID || !assignToFranchiseID) {
      return res.status(400).json({
        status: false,
        message: "responseID and assignToFranchiseID are required",
      });
    }

    // Validate franchise exists
    const franchise = await Franchiselist.findOne({
      franchiseID: assignToFranchiseID,
    });
    if (!franchise) {
      return res.status(404).json({
        status: false,
        message: "Target franchise not found",
      });
    }

    const updated = await StudentResponse.findByIdAndUpdate(
      responseID,
      {
        assignedToFranchiseID,
        assignedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: "Student response not found",
      });
    }

    res.json({
      status: true,
      message: "Student assigned successfully",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// 10. ADD PHONE NUMBER AND SHARE LINK (ADMIN)
route.post("/admin/add-number-and-link", async (req, res) => {
  try {
    const { franchiseID, phoneNumber, name } = req.body;

    if (!franchiseID || !phoneNumber) {
      return res.status(400).json({
        status: false,
        message: "franchiseID and phoneNumber are required",
      });
    }

    // Add phone number
    const newPhoneEntry = new FranchisePhoneList({
      franchiseID,
      phoneNumber,
      name: name || null,
    });

    await newPhoneEntry.save();

    // Generate link
    const uniqueLink = `${process.env.FRONTEND_URL || "http://localhost:3001"}/submit-form?franchise=${franchiseID}&phone=${encodeURIComponent(phoneNumber)}`;

    // Send WhatsApp
    const formattedPhone = phoneNumber.startsWith("0") 
      ? "91" + phoneNumber.substring(1) 
      : "91" + phoneNumber;

    const message = `Hello! 👋\n\nWe'd love to hear from you about our programs. Please fill out this quick form:\n\n${uniqueLink}\n\nThank you!`;

    const whatsappResponse = await sendWhatsAppMessage(formattedPhone, message);

    res.json({
      status: true,
      message: "Number added and link sent",
      data: {
        phoneEntry: newPhoneEntry,
        link: uniqueLink,
        whatsappStatus: whatsappResponse.status,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});

// ============================================
// HELPER FUNCTION
// ============================================

// Send WhatsApp message - Replace with your WhatsApp API provider
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // Example: Using a generic WhatsApp API (Twilio, MessageBird, etc.)
    // Replace this with your actual WhatsApp API integration

    console.log(`WhatsApp to ${phoneNumber}: ${message}`);

    // Placeholder response
    return {
      status: "pending",
      messageID: `msg_${Date.now()}`,
    };

    // Real implementation example (Twilio):
    // const response = await axios.post(
    //   `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    //   {
    //     From: `whatsapp:${process.env.TWILIO_PHONE}`,
    //     To: `whatsapp:+${phoneNumber}`,
    //     Body: message,
    //   },
    //   {
    //     auth: {
    //       username: process.env.TWILIO_ACCOUNT_SID,
    //       password: process.env.TWILIO_AUTH_TOKEN,
    //     },
    //   }
    // );
    // return { status: "sent", messageID: response.data.sid };
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return {
      status: "failed",
      error: err.message,
    };
  }
}

module.exports = route;
