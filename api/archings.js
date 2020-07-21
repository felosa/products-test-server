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

// TODOS LOS ARQUEOS DE UN CENTRO
router.get(
    "/:centerID",
    [param("centerID").isInt().toInt()],
  // defaultGetValidators,
  (req, res) => {
    const query = knex("archings")
      .select()
      .where("idCenter", data.centerID)
      .then((results) => {
        return res.json({
          results,
        });
      })
      .catch((error) => res.status(500).send(JSON.stringify(error)));
  }
);

// CREAR ARQUEO HACER DE 0
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




module.exports = router;
