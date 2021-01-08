exports.up = function(knex) {
  return knex.schema.createTable("products", table => {
    table.increments();
    table.text("name");
    table.text("type");
    table.text("price");
    table.datetime("expiryDate");
    table.text("description");
    table.text("country");
    table.datetime("createdAt").defaultTo(knex.fn.now());
    table.datetime("updatedAt").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("products");
};
