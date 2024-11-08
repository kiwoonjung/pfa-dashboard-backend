require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_LOCAL_USER,
  password: process.env.DB_LOCAL_PASSWORD,
  host: process.env.DB_LOCAL_HOST,
  port: process.env.DB_LOCAL_PORT,
  database: process.env.DB_LOCAL_DBNAME,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
