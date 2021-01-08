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
      .orderBy("products.createdAt", "desc")
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
        .select(
          "products.id",
          "products.name",
          "products.type",
          "products.price",
          "products.expiryDate",
          "products.description",
          "products.country",
          "products.createdAt",
          "products.updatedAt",
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
    body("name"),
    body("type"),
    body("price"),
    body("expiryDate").toDate(),
    body("description"),
    body("country"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });
    console.log(req.body, "body")
    knex("products")
      .insert({
        name: data.name,
        type: data.type,
        price: data.price,
        expiryDate: data.expiryDate,
        description: data.description,
        country: data.country,
        createdAt: new Date(),
        updatedAt: new Date(),
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
  param("ID"),
  body("name"),
  body("type"),
  body("price"),
  body("expiryDate").toDate(),
  body("description"),
  body("country"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("products")
      .update({
        name: data.name,
        type: data.type,
        price: data.price,
        expiryDate: data.expiryDate,
        description: data.description,
        country: data.country,
        updatedAt: new Date(),
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
