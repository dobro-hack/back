const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Подключение маршрутов
const requestRoutes = require("./routes/requests");
const messageRoutes = require("./routes/messages");
const routeRoutes = require("./routes/routes");
const placeRoutes = require("./routes/places");
const parkRoutes = require("./routes/parks");

app.use(requestRoutes);
app.use(messageRoutes);
app.use(routeRoutes);
app.use(placeRoutes);
app.use(parkRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
