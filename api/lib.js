
const knex = require("../db/knex"); 


module.exports.genCountQuery = query => {
  return query
    .clone()
    .count("*", { as: "totalResults" })
    .limit(999999)
    .offset(0)
    .first();
};

module.exports.genCountQueryVessels = query => {
  return query
    .clone()
    .count("*", { as: "totalResults" })
    .limit(999999)
    .offset(0)
    // .first();
};

module.exports.genBaseQuery = (tableName, perPage, page) => {
  const query = knex(tableName)
    .limit(perPage)
    .offset((page - 1) * perPage);

  return query;
};

module.exports.applyFilterConditions = (query, filterTerms) => {
  for (let [key, value] of Object.entries(filterTerms)) {
    if (value !== null) {
      query.where(key, "LIKE", `%${value}%`);
    }
  }
};

module.exports.applyOrderBy = (query, defaultOrderBy, orderBy, orderDir) => {
  query.orderBy(
    orderBy ? orderBy : defaultOrderBy,
    orderDir ? orderDir : "desc"
  );
};

//TODO: Implement
module.exports.applySearchConditions = (query, searchValue, fields) => {
  // if (searchValue === null) return;
  // fields.forEach(field => {
  //   console.log(field, searchValue);
  //   query.orWhere(field, "LIKE", `%${searchValue}%`);
  // });
};
