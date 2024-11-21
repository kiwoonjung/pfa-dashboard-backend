require("dotenv").config();
const axios = require("axios");
const knex = require("knex")(require("../knexfile"));

exports.getAllKits = async (req, res) => {
  try {
    const kits = await knex("kits")
      .select("kits.*")
      .leftJoin("kit_lines", "kits.sku", "kit_lines.kit_sku")
      .leftJoin("items", "kit_lines.id", "items.kit_line_id")
      .modify((query) => {
        // To avoid duplicate entries when joining, group rows for aggregation
        query
          .select(
            knex.raw(`
          JSON_AGG(
            DISTINCT jsonb_build_object(
              'line_name', kit_lines.line_name,
              'combine', kit_lines.combine,
              'quantity', kit_lines.quantity,
              'items', (
                SELECT JSON_AGG(DISTINCT jsonb_build_object(
                  'sku', items.sku,
                  'code', items.code,
                  'description', items.description
                )) FROM items WHERE kit_lines.id = items.kit_line_id
              )
            )
          ) AS kit_lines
        `)
          )
          .groupBy("kits.sku");
      });

    res.status(200).json(kits);
  } catch (error) {
    console.error("Error fetching kits:", error);
    res.status(500).json({
      message: "Failed to fetch kits from the database.",
      error: error.message,
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

    // Fetch the data from the API with retry logic
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

    const kits = response.data.Kits; // Extract Kits array from API response

    // Insert the data into the database
    await knex.transaction(async (trx) => {
      for (const kit of kits) {
        // Insert into `kits` table
        await trx("kits").insert({
          sku: kit.SKU,
          code: kit.Code,
          cost: kit.Cost,
          description: kit.Description,
          last_modified_date_time_utc: kit.LastModifiedDateTimeUtc || null,
          available_quantity: kit.AvailableQuantity || 0,
          available_quantity_last_modified_date_time_utc:
            kit.AvailableQuantityLastModifiedDateTimeUtc || null,
        });

        // Insert into `kit_lines` table
        for (const line of kit.KitLines) {
          const [kitLineId] = await trx("kit_lines").insert(
            {
              kit_sku: kit.SKU,
              line_name: line.LineName,
              combine: line.Combine,
              quantity: line.Quantity,
            },
            ["id"] // Return the inserted ID for this row
          );

          // Insert into `items` table
          for (const item of line.Items) {
            await trx("items").insert({
              kit_line_id: kitLineId.id,
              sku: item.SKU,
              code: item.Code,
              description: item.Description,
            });
          }
        }
      }
    });

    res
      .status(200)
      .json({ message: "Kits successfully saved to the database" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to save kits to the database." });
  }
};
