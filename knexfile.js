require("dotenv").config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: "pg",
  connection: {
    user: process.env.DB_LOCAL_USER,
    password: process.env.DB_LOCAL_PASSWORD,
    host: process.env.DB_LOCAL_HOST,
    port: process.env.DB_LOCAL_PORT,
    database: process.env.DB_LOCAL_DBNAME,
  },
  migrations: {
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};
