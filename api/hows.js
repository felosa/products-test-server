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

// TODOS LOS HOWS DE UN CENTRO
router.get(
  "/",
  [query("centerID").optional()],
  // defaultGetValidators,
  async (req, res) => {
    var { centerID = null } = req.query;
    
    var getQuery = knex.table("hows");

    if (centerID) {
      getQuery.where("hows.idCenter", centerID);
    }

    const query = getQuery
      .select("hows.id", "hows.name", "hows.idCenter", "hows.active")
      .then((results) => {
        return res.json({
          results,
        });
      })
      .catch((error) => res.status(500).send(JSON.stringify(error)));
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
