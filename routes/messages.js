const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/messages-sql", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status;
  const offset = (page - 1) * limit;

  const dataQuery = `
    SELECT 
      m.id AS message_id,
      m.status AS message_status,
      m.sent_at AS message_sent_at,
      m.type AS message_type,
      m.message AS message_content,
      m.file_url AS message_file_url,
      m.phone AS message_phone,
      m.location AS message_location,
      p.id AS user_id,
      p.first_name AS user_first_name,
      p.middle_name AS user_middle_name,
      p.last_name AS user_last_name,
      rt.name AS route_name
    FROM 
      message m
    JOIN 
      person p ON m.user_id = p.id
    LEFT JOIN 
      request r ON r.user_id = m.user_id
    LEFT JOIN
      route rt ON r.route_id = rt.id
    WHERE 
      m.status = ?
    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM message
    WHERE status = ?
  `;

  try {
    const [results] = await pool.query(dataQuery, [status, limit, offset]);
    const [countResult] = await pool.query(countQuery, [status]);
    const total = countResult[0].total;

    res.json({
      total,
      data: results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
