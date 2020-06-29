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

// TODOS LOS PERMISOS
router.get(
  "/",
  // defaultGetValidators,
  (req, res) => {
    const query = knex("permissions")
      .select("permissions.id", "permissions.name")
      .then((results) => {
        return res.json({
          results,
        });
      })
      .catch((error) => res.status(500).send(JSON.stringify(error)));
  }
);

// CREAR PERMISSION
router.post("/", [body("name")], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const data = matchedData(req, { includeOptionals: true });

  knex("permissions")
    .insert({
      name: data.name.toUpperCase(),
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

// EDIT PERMISSION
router.post(
  "/:ID",
  [param("ID").isInt().toInt(), body("name")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("permissions")
      .update({
        name: data.name.toUpperCase(),
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
  }
);


// DELETE
router.delete("/:ID", [param("ID").isInt().toInt()], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const { ID } = matchedData(req, { includeOptionals: true });
  
    knex("permissions")
      .where({
        id: ID,
      })
      .del()
      .then((value) => {
        if (value > 0) {
          return res.send("OK");
        }
        return res.status(404).send("Not found");
      })
      .catch((error) => {
        return res.status(500).send(error);
      });
  });

module.exports = router;
