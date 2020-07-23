const express = require("express");
const {
  query,
  validationResult,
  matchedData,
  param,
  body,
} = require("express-validator");
const knex = require("../db/knex"); //the connection

const router = express.Router();

router.get(
  "/",
  [
    query("centerID").optional(),
    query("search").optional(),
    query("orderBy").optional({ nullable: true }),
    query("orderDir").isIn(["asc", "desc"]).optional({ nullable: true }),
    query("perPage").isInt({ min: 1, max: 100 }).toInt().optional(),
    query("page").isInt({ min: 1 }).toInt().optional(),
    // query("firstName").optional(),
    // query("lastName").optional(),
    // query("jobTitle").optional(),
    // query("companyName").optional(),
    // query("countryName").optional(),
    // query("countryID").optional(),
    // query("regionName").optional(),
    // query("regionID").optional(),
  ],
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    var {
      centerID = null,
      orderBy = null,
      orderDir = null,
      perPage = 10,
      page = 1,
      // firstName = null,
      // lastName = null,
      // jobTitle = null,
      // companyName = null,
      // countryName = null,
      // countryID = null,
      // regionName = null,
      // regionID = null,
    } = req.query;
    console.log(centerID, "centerID");

    var getQuery = knex.table("tariffs");

    if (centerID) {
      getQuery.where("tariffs.idCenter", centerID);
    }

    var totalCount = await getQuery
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQuery
      .limit(perPage)
      .offset((page - 1) * perPage)
      // .leftJoin("centers", "centers.id", "tariffs.idCenter")
      .select();


    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);


// CREAR HOW
router.post("/", [body("name"), body("centerID")], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const data = matchedData(req, { includeOptionals: true });

  knex("hows")
    .insert({
      name: data.name.toUpperCase(),
      idCenter: data.centerID,
      active: 1,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .then(([newID]) => {
      return res.json({ newID });
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
});

// DISABLE HOW
router.post("/:ID", [param("ID").isInt().toInt()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const data = matchedData(req, { includeOptionals: true });

  knex("hows")
    .update({
      active: 0,
      updated_at: new Date(),
    })
    .where("id", data.ID)
    .then((result) => {
      if (result > 0) {
        return res.send(`Updated`);
      }
      return res.status(404).send("Not found");
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
});

module.exports = router;
