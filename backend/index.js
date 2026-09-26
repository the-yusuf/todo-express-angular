require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const credentials = require("./src/middlewares/credentials");
const corsOptions = require("./src/config/corsOptions");
const verifyJWT = require("./src/middlewares/verifyJWT");
const { connectDB } = require("./src/pool");
const app = express();
const PORT = process.env.PORT || 5050;

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

app.use("/api/auth", require("./src/routes/auth.routes"));

app.use(verifyJWT);

app.use("/api/todos", require("./src/routes/todo.routes"));

connectDB(() => {
  console.log("Connected to Postgres Database");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}\nhttp://localhost:${PORT}`);
  });
});
