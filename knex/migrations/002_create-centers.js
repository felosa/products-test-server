exports.up = function(knex) {
  return knex.schema.createTable("centers", table => {
    table.increments();
    table.text("name");
    table.text("minPrice");
    table.text("maxPrice");
    table.text("denomination");
    table.text("adress");
    table.text("postalCode");
    table.text("city");
    table.text("master");
    table.text("masterDNI");
    table.text("cif");
    table.text("provinceNumber");
    table.text("sectionNumber");
    table.text("controlDigit");
    table.datetime("createdAt").defaultTo(knex.fn.now());
    table.datetime("updatedAt").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("user");
};
