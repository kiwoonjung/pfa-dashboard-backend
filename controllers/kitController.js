require("dotenv").config();
const axios = require("axios");
const knex = require("knex")(require("../knexfile"));

exports.getAllKits = async (req, res) => {
  try {
    const data = await knex("kits");
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({
      message: "There was an error getting kits",
      error: error,
    });
  }
};

exports.getAllKitsFromSkuVault = async (req, res) => {
  try {
    const apiUrl = `https://app.skuvault.com/api/products/getKits`;
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const data = {
      TenantToken: process.env.SKUVAULT_TENANT_TOKEN,
      UserToken: process.env.SKUVAULT_USER_TOKEN,
    };

    let response;
    let retry = true;

    while (retry) {
      try {
        response = await axios.post(apiUrl, data, { headers });
        retry = false; // Exit loop if successful
      } catch (error) {
        if (error.response && error.response.status === 429) {
          const resetTime = parseInt(
            error.response.headers["x-ratelimit-reset"],
            10
          );
          console.warn(
            `Throttled. Waiting ${resetTime} milliseconds before retrying...`
          );
          await new Promise((resolve) => setTimeout(resolve, resetTime));
        } else {
          throw error;
        }
      }
    }

    res.status(200).send(response.data);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};
