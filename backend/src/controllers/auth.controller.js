const bcrypt = require("bcrypt");
const { pool } = require("../pool");
const jwt = require("jsonwebtoken");

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

const login = async (req, res) => {
  const cookies = req.cookies;
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and Password required!" });

  const foundUserResponse = await pool.query(
    `
        SELECT * FROM users
        WHERE email = $1
    `,
    [email],
  );

  const foundUser = foundUserResponse.rows[0];

  if (!foundUser) return res.status(404).json({ message: "User not found!" });

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match)
    return res.status(400).json({ message: "Password is incorrect!" });

  const accessToken = jwt.sign(
    {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1m" },
  );

  const refreshToken = jwt.sign(
    {
      id: foundUser.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" },
  );

  if (cookies?.jwt) {
    await pool.query(
      `
          DELETE FROM sessions
          WHERE user_id = $1 AND refresh_token = $2
      `,
      [foundUser.id, cookies.jwt],
    );
  }

  await pool.query(
    `
        INSERT INTO sessions (user_id, refresh_token)
        VALUES ($1, $2)
        RETURNING *
    `,
    [foundUser.id, refreshToken],
  );

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    sameSite: "None",
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
};

const refresh = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  res.clearCookie("jwt", { httpOnly: true });

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err)
        return res.status(401).json({ message: "Refresh token is not valid" });

      const foundUserRes = await pool.query(
        `
          SELECT * FROM users
          WHERE id = $1
        `,
        [decoded.id],
      );

      const foundUser = foundUserRes.rows[0];

      if (!foundUser)
        return res.status(404).json({ message: "User not found" });

      const accessToken = jwt.sign(
        {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1m" },
      );

      const newRefreshToken = jwt.sign(
        {
          id: foundUser.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" },
      );

      await pool.query(
        `
          DELETE FROM sessions
          WHERE user_id = $1 AND refresh_token = $2
      `,
        [foundUser.id, refreshToken],
      );

      await pool.query(
        `
        INSERT INTO sessions (user_id, refresh_token)
        VALUES ($1, $2)
        RETURNING *
    `,
        [foundUser.id, newRefreshToken],
      );

      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        sameSite: "None",
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    },
  );
};

const logout = async (req, res) => {
  const cookies = req.cookies;
  if (cookies.jwt) {
    const refreshToken = cookies.jwt;

    res.clearCookie("jwt", { httpOnly: true });

    await pool.query(
      `
        DELETE FROM users
        WHERE refresh_token = $1
      `,
      [refreshToken],
    );
  }
};

module.exports = { register, login, refresh, logout };
