require("dotenv").config();
const express = require("express");
const connectDB = require("./src/pool");
const app = express();
const PORT = process.env.PORT || 5050;

connectDB(() => {
  console.log("Connected to DB");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\nhttp://localhost:${PORT}`);
  });
});
