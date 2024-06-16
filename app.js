const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const pool = require("./db");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Fetch requests
app.get("/requests-sql", async (req, res) => {
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
      pk.description AS park_description
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

  try {
    const [results] = await pool.query(query, [limit, offset]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch messages
app.get("/messages-sql", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
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
      pk.id AS park_id,
      pk.name AS park_name
    FROM 
      message m
    JOIN 
      person p ON m.user_id = p.id
    LEFT JOIN 
      park pk ON pk.id = p.id
    LIMIT ? OFFSET ?;
  `;

  try {
    const [results] = await pool.query(query, [limit, offset]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/routes-sql", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `
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
    LIMIT ? OFFSET ?;
  `;

  try {
    const [results] = await pool.query(query, [limit, offset]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/routes-sql", async (req, res) => {
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

const updateRecreationalCapacity = async (routeId) => {
  const routeQuery = `
    SELECT * FROM route WHERE id = ?;
  `;

  const placeQuery = `
    SELECT * FROM place WHERE route_id = ? AND used_in_calculations = true;
  `;

  try {
    const [routeResults] = await pool.query(routeQuery, [routeId]);

    if (routeResults.length === 0) {
      throw new Error("Route not found");
    }

    for (const route of routeResults) {
      const [placeResults] = await pool.query(placeQuery, [route.id]);

      // Calculate load and max_load
      const load = new Array(366).fill(0);
      const maxLoad = new Array(366).fill(0);

      // Calculate BCC for the route itself
      const DTp = route.length;
      const DGp = route.group_distance;
      const Ts = 12;
      const Tdp = route.average_time;
      const GS = route.group_size;
      const tp = route.days_on_route;

      let routeBCC = 0;
      if (Tdp > Ts) {
        routeBCC = Math.floor(GS * tp * (365 / tp));
      } else {
        routeBCC = Math.floor((DTp / DGp) * (Ts / Tdp) * GS * tp * (365 / tp));
      }

      for (let i = 0; i < 366; i++) {
        load[i] += routeBCC;
        maxLoad[i] += routeBCC;
      }

      // Calculate BCC for each place
      placeResults.forEach((place) => {
        const { area, area_per_visitor, return_coefficient, days } = place;
        const BCCq = Math.floor(
          (area / area_per_visitor) * return_coefficient * days * (365 / days)
        );

        for (let i = 0; i < 366; i++) {
          load[i] += BCCq;
          maxLoad[i] += BCCq;
        }
      });

      // Update route with new load and max_load
      const updateQuery = `
        UPDATE route 
        SET \`load\` = ?, max_load = ?
        WHERE id = ?;
      `;

      await pool.query(updateQuery, [
        JSON.stringify(load),
        JSON.stringify(maxLoad),
        route.id,
      ]);
    }
  } catch (error) {
    console.error(error);
  }
};

// Новый маршрут для получения списка парков
app.get("/parks", async (req, res) => {
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

app.get("/places/:route_id", async (req, res) => {
  const routeId = req.params.route_id;

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
    WHERE route_id = ?;
  `;

  try {
    const [results] = await pool.query(query, [routeId]);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/places", async (req, res) => {
  const {
    id,
    route_id,
    name,
    description,
    icon,
    area,
    area_per_visitor,
    return_coefficient,
    days,
    used_in_calculations,
  } = req.body;

  if (id) {
    // Обновление существующего места
    const updateQuery = `
      UPDATE place 
      SET route_id = ?, name = ?, description = ?, icon = ?, area = ?, area_per_visitor = ?, return_coefficient = ?, days = ?, used_in_calculations = ?
      WHERE id = ?;
    `;

    try {
      await pool.query(updateQuery, [
        route_id,
        name,
        description,
        icon,
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
      INSERT INTO place (route_id, name, description, icon, area, area_per_visitor, return_coefficient, days, used_in_calculations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    try {
      const [result] = await pool.query(insertQuery, [
        route_id,
        name,
        description,
        icon,
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
