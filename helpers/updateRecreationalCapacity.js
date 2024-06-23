const pool = require("../db");

const updateRecreationalCapacity = async (routeId) => {
  const routeQuery = `
    SELECT * FROM route WHERE id = ?;
  `;

  const placeQuery = `
    SELECT * FROM place WHERE route_id = ? AND used_in_calculations = 1;
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

module.exports = { updateRecreationalCapacity };
