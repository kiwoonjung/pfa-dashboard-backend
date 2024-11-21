exports.up = async function (knex) {
  // Create kits table
  await knex.schema.createTable("kits", (table) => {
    table.string("sku").primary(); // SKU as the primary key
    table.string("code").notNullable();
    table.decimal("cost", 10, 2).defaultTo(0);
    table.string("description").notNullable();
    table.timestamp("last_modified_date_time_utc").nullable(); // Allow nullable for empty strings
    table.integer("available_quantity").defaultTo(0);
    table
      .timestamp("available_quantity_last_modified_date_time_utc")
      .nullable(); // Allow nullable for empty strings
  });

  // Create kit_lines table
  await knex.schema.createTable("kit_lines", (table) => {
    table.increments("id").primary(); // Unique ID for each kit line
    table
      .string("kit_sku") // Reference to the 'sku' from kits table
      .references("sku")
      .inTable("kits")
      .onDelete("CASCADE");
    table.string("line_name").notNullable();
    table.integer("combine").defaultTo(1); // Use integer for consistency with API data
    table.integer("quantity").defaultTo(0);
  });

  // Create items table
  await knex.schema.createTable("items", (table) => {
    table.increments("id").primary(); // Unique ID for each item
    table
      .integer("kit_line_id") // Reference to the 'id' from kit_lines table
      .references("id")
      .inTable("kit_lines")
      .onDelete("CASCADE");
    table.string("sku").notNullable();
    table.string("code").notNullable();
    table.string("description").notNullable();
    table.unique(["kit_line_id", "sku"]); // Ensure no duplicate items for a kit line
  });

  // Indexes for performance
  await knex.schema.alterTable("kit_lines", (table) => {
    table.index("kit_sku");
  });

  await knex.schema.alterTable("items", (table) => {
    table.index("kit_line_id");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("items");
  await knex.schema.dropTableIfExists("kit_lines");
  await knex.schema.dropTableIfExists("kits");
};
