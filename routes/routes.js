const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  updateRecreationalCapacity,
} = require("../helpers/updateRecreationalCapacity");

router.get("/routes-sql", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const parkId = parseInt(req.query.parkId);

  let query = `
    SELECT 
      r.id AS route_id,
      r.name AS route_name,
      r.description AS route_description,
      r.how_to_get,
      r.what_to_take,
      r.in_emergency,
      r.recommendations,
      r.length AS route_length,
      r.duration AS route_duration,
      r.height AS route_height,
      r.difficulty AS route_difficulty,
      r.group_distance,
      r.average_time,
      r.group_size,
      r.days_on_route,
      r.load,
      r.max_load,
      r.gpx_data,
      pk.id AS park_id,
      pk.name AS park_name,
      pk.description AS park_description
    FROM 
      route r
    JOIN 
      park pk ON r.park_id = pk.id
  `;

  let countQuery = `
    SELECT COUNT(*) AS total
    FROM route r
    JOIN park pk ON r.park_id = pk.id
  `;

  const queryParams = [limit, offset];
  if (parkId) {
    query += ` WHERE pk.id = ?`;
    countQuery += ` WHERE pk.id = ?`;
    queryParams.unshift(parkId);
  }

  query += ` LIMIT ? OFFSET ?;`;

  try {
    const [results] = await pool.query(query, queryParams);
    const [totalResults] = await pool.query(countQuery, parkId ? [parkId] : []);
    res.json({ data: results, total: totalResults[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/routes-sql", async (req, res) => {
  const {
    id,
    park_id,
    name,
    description,
    how_to_get,
    what_to_take,
    in_emergency,
    recommendations,
    length,
    duration,
    height,
    difficulty,
    group_distance,
    average_time,
    group_size,
    days_on_route,
    gpx_data,
  } = req.body;

  const checkQuery = `SELECT id FROM route WHERE id = ?`;
  const insertQuery = `
    INSERT INTO route (
      id,
      park_id,
      name,
      description,
      how_to_get,
      what_to_take,
      in_emergency,
      recommendations,
      length,
      duration,
      height,
      difficulty,
      group_distance,
      average_time,
      group_size,
      days_on_route,
      gpx_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const updateQuery = `
    UPDATE route SET
      park_id = ?,
      name = ?,
      description = ?,
      how_to_get = ?,
      what_to_take = ?,
      in_emergency = ?,
      recommendations = ?,
      length = ?,
      duration = ?,
      height = ?,
      difficulty = ?,
      group_distance = ?,
      average_time = ?,
      group_size = ?,
      days_on_route = ?,
      gpx_data = ?
    WHERE id = ?
  `;

  try {
    const [checkResult] = await pool.query(checkQuery, [id]);

    if (checkResult.length > 0) {
      // Update existing route
      console.warn("Updating route with id " + id);
      await pool.query(updateQuery, [
        park_id,
        name,
        description,
        how_to_get,
        what_to_take,
        in_emergency,
        recommendations,
        length,
        duration,
        height,
        difficulty,
        group_distance,
        average_time,
        group_size,
        days_on_route,
        gpx_data,
        id,
      ]);
    } else {
      // Insert new route
      console.warn("Inserting new route with id " + id);
      await pool.query(insertQuery, [
        id,
        park_id,
        name,
        description,
        how_to_get,
        what_to_take,
        in_emergency,
        recommendations,
        length,
        duration,
        height,
        difficulty,
        group_distance,
        average_time,
        group_size,
        days_on_route,
        gpx_data,
      ]);
    }

    await updateRecreationalCapacity(id);

    res.status(200).json({ message: "Route successfully created or updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
