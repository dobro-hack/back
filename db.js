const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "newuser",
  password: "password",
  database: "lct2024",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const pool2 = mysql.createPool({
  host: "rc1d-jofqjmulg3ptf850.mdb.yandexcloud.net",
  user: "lct2024hack",
  password: "lct2024hack",
  database: "lct2024hack",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    ca: fs.readFileSync(path.resolve(__dirname, "CA.pem")),
  },
});

module.exports = pool;
