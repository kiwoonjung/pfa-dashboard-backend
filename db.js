const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "rootroot",
  host: "localhost",
  port: 5432, // default Postgres port
  database: "learning",
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
