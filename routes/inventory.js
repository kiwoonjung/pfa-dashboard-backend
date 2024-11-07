var express = require("express");
var router = express.Router();
const db = require("../db");

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query("SELECT * FROM products");
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
