const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// GET all lead responses
router.get('/lead-responses', async (req, res) => {
  try {
    const leads = await Lead.find({});
    res.json({ status: true, data: leads });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

module.exports = router;
