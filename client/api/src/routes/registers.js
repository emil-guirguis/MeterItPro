const express = require('express');
const router = express.Router();
const db = require('../config/database');


// GET /api/registers - Get all registers 
router.get('/', async (req, res) => {
  try {

    // Get all registers
    const registers = await db.query(
      `SELECT register_id, number, name, unit, field_name
       FROM register
       ORDER BY number ASC`,
    );

    res.json({
      success: true,
      data: registers.rows,
    });
  } catch (error) {
    console.error('Error fetching registers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registers',
      error: errorMessage,
    });
  }
});

module.exports = router;
