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

// TODOS LOS CLOSURES
router.get(
  "/:centerID",
  [param("centerID").isInt().toInt()],
  // defaultGetValidators,
  (req, res) => {
    const { centerID } = matchedData(req);
    // HABRA QUE ANADIR FILTROS PARA FILTRAR POR CENTRO O SACAR TODOS
    const query = knex("closures")
      .select()
      .where("idCenter", centerID)
      .then((results) => {
        return res.json({
          results,
        });
      })
      .catch((error) => res.status(500).send(JSON.stringify(error)));
  }
);

// CREAR CLOSURE
router.post(
  "/",
  [
    body("idCenter").toInt(),
    body("description"),
    body("date"),
    body("quantity"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("closures")
      .insert({
        description: data.description,
        date: new Date(),
        quantity: data.quantity,
        idCenter: data.idCenter,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .then(([newID]) => {
        return res.json({ newID });
      })
      .catch((err) => {
        return res.status(500).send(err);
      });
  }
);

// EDIT CLOSURE
router.post(
  "/:ID",
  [
    param("ID").isInt().toInt(),
    body("description"),
    body("date"),
    body("quantity"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("closures")
      .update({
        description: data.description,
        date: new Date(),
        quantity: data.quantity,
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


module.exports = router;
