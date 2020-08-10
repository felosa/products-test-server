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
  // defaultGetValidators,
  (req, res) => {
    const query = knex("class_types")
      .select(
        "class_types.id",
        "class_types.description",
        "class_types.duration"
      )
      .then((results) => {
        return res.json({
          results,
        });
      })
      .catch((error) => res.status(500).send(JSON.stringify(error)));
  }
);

module.exports = router;
