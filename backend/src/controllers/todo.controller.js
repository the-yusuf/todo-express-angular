const { pool } = require("../pool");

const getAll = async (req, res) => {
  const todoRes = await pool.query(`
            SELECT * FROM todos
        `);

  res.json(todoRes.rows);
};

const getById = async (req, res) => {
  const id = req?.params?.id;
  if (!id) return res.status(400).json({ message: "Id is required" });

  const foundTodo = await pool.query(
    `
        SELECT * FROM todos
        WHERE id = $1
    `,
    [id],
  );

  res.json(foundTodo.rows[0]);
};

const create = async (req, res) => {
  const { user_id, title, description } = req?.body;
  if (!user_id || !title || !description) return res.sendStatus(400);

  const createRes = await pool.query(
    `
        INSERT INTO todos (user_id, title, description)
        VALUES ($1, $2, $3) 
        RETURNING *
    `,
    [user_id, title, description],
  );

  res.json(createRes.rows[0]);
};

const update = async (req, res) => {
  const id = req?.params?.id;
  if (!id) return res.status(400).json({ message: "Id is required" });

  const { user_id, title, description, status } = req?.body;
  if (!user_id || !title || !description || !status) return res.sendStatus(400);

  const updateRes = await pool.query(
    `
        UPDATE todos
        SET user_id = $1, title = $2, description = $3, status = $4
        WHERE id = $5
        RETURNING *
    `,
    [user_id, title, description, status, id],
  );

  res.json(updateRes.rows[0]);
};

const remove = async (req, res) => {
  const id = req?.params?.id;
  if (!id) return res.status(400).json({ message: "Id is required" });

  const deteRes = await pool.query(
    `
        DELETE FROM todos
        WHERE id = $1
        RETURNING *
    `,
    [id],
  );

  res.json(deteRes.rows[0]);
};

module.exports = { getAll, getById, create, update, remove };
