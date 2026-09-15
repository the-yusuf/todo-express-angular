require("dotenv").config();
const express = require("express");
const { connectDB } = require("./src/pool");
const app = express();
const PORT = process.env.PORT || 5050;

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

app.use("/api/auth", require("./src/routes/auth.routes"));

connectDB(() => {
  console.log("Connected to Postgres Database");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\nhttp://localhost:${PORT}`);
  });
});
