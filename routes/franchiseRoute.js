var express = require("express");
var route = express.Router();
const FranchisePhoneList = require("../models/franchisePhoneList");
const Lead = require("../models/Lead");
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
// This feature is now handled by the external Lead application. If you need to send a link, please use the Lead service.

// 5. GET ALL STUDENT RESPONSES FOR A FRANCHISE (from Lead)
route.get("/franchise/:franchiseID/responses", async (req, res) => {
  try {
    const { franchiseID } = req.params;

    // Find all phone numbers for this franchise
    const phoneList = await FranchisePhoneList.find({ franchiseID });
    const phoneNumbers = phoneList.map(p => p.phoneNumber);

    // Find all leads for these phone numbers and franchise
    const responses = await Lead.find({ 
      $or: [
        { phone: { $in: phoneNumbers }, franchiseName: franchiseID },
        { franchiseName: franchiseID, franchiseUniqueLink: true }
      ]
    }).sort({ submittedAt: -1 });


    res.json({
      status: true,
      data: {
        all: responses,
        counts: {
          total: responses.length,
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

// 6. CHECK IF PHONE ALREADY SUBMITTED (from Lead)
route.get("/student/check-phone", async (req, res) => {
  try {
    const { phoneNumber, franchiseID } = req.query;

    if (!phoneNumber || !franchiseID) {
      return res.status(400).json({
        status: false,
        message: "phoneNumber and franchiseID are required",
      });
    }

    const existing = await Lead.findOne({
      phone: phoneNumber,
      franchiseName: franchiseID,
      submitted: true
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



// ============================================
// ADMIN APIs
// ============================================

// 8. GET ALL STUDENT RESPONSES (ADMIN, from Lead)
route.get("/admin/all-responses", async (req, res) => {
  try {
    const responses = await Lead.find({}).sort({ submittedAt: -1 });
    const stats = {
      total: responses.length,
      assigned: responses.filter((r) => r.franchiseName).length,
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

// 9. ASSIGN LEAD TO FRANCHISE (ADMIN)
route.post("/admin/assign-lead", async (req, res) => {
  try {
    const { leadId, assignToFranchiseID } = req.body;

    if (!leadId || !assignToFranchiseID) {
      return res.status(400).json({
        status: false,
        message: "leadId and assignToFranchiseID are required",
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

    const updated = await Lead.findByIdAndUpdate(
      leadId,
      {
        franchiseName: assignToFranchiseID,
        assignedByAdmin: true
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        status: false,
        message: "Lead not found",
      });
    }

    res.json({
      status: true,
      message: "Lead assigned successfully",
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
