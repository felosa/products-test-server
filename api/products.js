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

// ALL PRODUCTS
router.get(
  "/",
  [],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }


    return knex
      .table("products")
      .orderBy("products.created_at", "desc")
      .then(result => { return res.json(result) });

  }
);

// GET ONE PRODUCT
router.get(
  "/:productID",
  [param("productID").isInt().toInt()],
  async (req, res) => {
    try {
      const { productID } = matchedData(req);
      var productQuery = knex("products")
        .leftJoin("centers", "centers.id", "vehicles.idCenter")
        .select(
          "vehicles.id",
          "vehicles.enrollment",
          "vehicles.description",
          "vehicles.itvDueDate",
          "vehicles.insuranceDueDate",
          "vehicles.nextPreventiveMaintenance",
          "vehicles.idCenter",
          "centers.name as centerName"
        )
        .where("products.id", productID)
        .first()
        .then((result) => {
          return res.json(result);
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).send("Error");
        });
    } catch (error) {
      console.log(error);
      return res.status(500).send("Error");
    }
  }
);

// CREATE PRODUCT
router.post(
  "/",
  [
    body("enrollment"),
    body("description"),
    body("itvDueDate").toDate(),
    body("insuranceDueDate").toDate(),
    body("nextPreventiveMaintenance").toDate(),
    body("idCenter"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("products")
      .insert({
        enrollment: data.enrollment,
        description: data.description,
        itvDueDate: data.itvDueDate,
        insuranceDueDate: data.insuranceDueDate,
        nextPreventiveMaintenance: data.nextPreventiveMaintenance,
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

// EDIT PRODUCT
router.post(
  "/:ID",
  [
    param("ID").isInt().toInt(),
    body("enrollment"),
    body("description"),
    body("itvDueDate").toDate(),
    body("insuranceDueDate").toDate(),
    body("nextPreventiveMaintenance").toDate(),
    body("idCenter"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("products")
      .update({
        enrollment: data.enrollment,
        description: data.description,
        itvDueDate: data.itvDueDate,
        insuranceDueDate: data.insuranceDueDate,
        nextPreventiveMaintenance: data.nextPreventiveMaintenance,
        idCenter: data.idCenter,
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

  knex("products")
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
