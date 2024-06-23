const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/requests-sql", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      r.request_id AS request_id,
      r.date_start AS request_start_date,
      r.quantity,
      p.first_name,
      p.middle_name,
      p.last_name,
      p.sitizen,
      p.region,
      p.gender,
      p.passport,
      p.birthday,
      p.email,
      p.phone,
      rt.name AS route_name,
      rt.description AS route_description,
      rt.length AS route_length,
      rt.duration AS route_duration,
      rt.height AS route_height,
      rt.difficulty AS route_difficulty,
      pk.name AS park_name,
      pk.description AS park_description,
      CASE
        WHEN r.status = 'pending' THEN 'Новая'
        WHEN r.status = 'delivered' THEN 'Одобрено'
        WHEN r.status = 'declined' THEN 'Отказано'
      END AS request_status
    FROM 
      request r
    JOIN 
      person p ON p.request_id = r.request_id
    JOIN 
      route rt ON rt.id = r.route_id
    JOIN 
      park pk ON pk.id = rt.park_id
    LIMIT ? OFFSET ?;
  `;

  const totalQuery = `
    SELECT COUNT(*) AS total
    FROM request;
  `;

  try {
    const [results] = await pool.query(query, [limit, offset]);
    const [totalResults] = await pool.query(totalQuery);
    res.json({ data: results, total: totalResults[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
