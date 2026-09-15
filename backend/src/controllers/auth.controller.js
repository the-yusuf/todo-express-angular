const bcrypt = require("bcrypt");
const { pool } = require("../pool");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required!" });

  if (password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characs." });

  const foundUser = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
    `,
    [email],
  );

  if (foundUser.rows.length > 0)
    return res.status(409).json({ message: "User already exists." });

  const hashedPassword = await bcrypt.hash(password, 10);

  const response = await pool.query(
    `
        INSERT INTO users (username, email, password)
        VALUES ($1, $2, $3)
        RETURNING *
    `,
    [username, email, hashedPassword],
  );

  res.json(response.rows[0]);
};

const login = (req, res) => {};

module.exports = { register, login };
