const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "127.0.0.1", // используйте IPv4 адрес
  user: "newuser",
  password: "password",
  database: "lct2024",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function clearDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const tables = [
      "message",
      "request",
      "org",
      "person",
      "device",
      "place",
      "review",
      "route_to_month",
      "route",
      "park",
    ];

    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }

    await connection.commit();
    console.log("База данных успешно очищена");
  } catch (error) {
    await connection.rollback();
    console.error("Ошибка при очистке базы данных:", error);
  } finally {
    connection.release();
  }
}

clearDatabase().catch((err) => console.error(err));
