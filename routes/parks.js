const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/parks", async (req, res) => {
  const query = `
    SELECT id, name, description, area
    FROM park;
  `;

  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
