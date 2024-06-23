const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  updateRecreationalCapacity,
} = require("../helpers/updateRecreationalCapacity");

router.get("/places/:route_id", async (req, res) => {
  const routeId = req.params.route_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      id,
      route_id,
      name,
      description,
      icon,
      location,
      area,
      area_per_visitor,
      used_in_calculations,
      return_coefficient,
      days
    FROM place
    WHERE route_id = ?
    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM place
    WHERE route_id = ?;
  `;

  try {
    const [results] = await pool.query(query, [routeId, limit, offset]);
    const [countResults] = await pool.query(countQuery, [routeId]);
    const total = countResults[0].total;

    res.json({ data: results, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/places", async (req, res) => {
  const {
    id,
    route_id,
    name,
    description,
    icon,
    location,
    area,
    area_per_visitor,
    return_coefficient,
    days,
    used_in_calculations,
  } = req.body;

  console.warn("location", location);

  if (id) {
    // Обновление существующего места
    const updateQuery = `
      UPDATE place 
      SET route_id = ?, name = ?, description = ?, icon = ?, location = CAST(? AS JSON), area = ?, area_per_visitor = ?, return_coefficient = ?, days = ?, used_in_calculations = ?
      WHERE id = ?;
    `;

    try {
      await pool.query(updateQuery, [
        route_id,
        name,
        description,
        icon,
        JSON.stringify(location),
        area,
        area_per_visitor,
        return_coefficient,
        days,
        used_in_calculations,
        id,
      ]);
      await updateRecreationalCapacity(route_id);
      res.json({
        id,
        route_id,
        name,
        description,
        icon,
        location,
        area,
        area_per_visitor,
        return_coefficient,
        days,
        used_in_calculations,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  } else {
    // Вставка нового места
    const insertQuery = `
      INSERT INTO place (route_id, name, description, icon, location, area, area_per_visitor, return_coefficient, days, used_in_calculations)
      VALUES (?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?);
    `;

    try {
      const [result] = await pool.query(insertQuery, [
        route_id,
        name,
        description,
        icon,
        JSON.stringify(location),
        area,
        area_per_visitor,
        return_coefficient,
        days,
        used_in_calculations,
      ]);
      await updateRecreationalCapacity(route_id);
      res.json({
        id: result.insertId,
        route_id,
        name,
        description,
        icon,
        location,
        area,
        area_per_visitor,
        return_coefficient,
        days,
        used_in_calculations,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
