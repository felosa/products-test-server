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

// TODOS LOS VEHICULOS
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
  async (req, res) => {
    // HABRA QUE ANADIR FILTROS PARA FILTRAR POR CENTRO O SACAR TODOS
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

    var getQuery = knex
      .table("vehicles")
      .orderBy("vehicles.created_at", "desc");
    if (centerID) {
      getQuery.where("vehicles.idCenter", centerID);
    }

    var totalCount = await getQuery
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQuery
      .limit(perPage)
      .offset((page - 1) * perPage)
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
      );

    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);

// GET ONE VEHICLE
router.get(
  "/:vehicleID",
  [param("vehicleID").isInt().toInt()],
  async (req, res) => {
    try {
      const { vehicleID } = matchedData(req);
      console.log(vehicleID, "req");
      var vehicleQuery = knex("vehicles")
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
        .where("vehicles.id", vehicleID)
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

// CREAR VEHICLE
router.post(
  "/",
  [
    body("enrollment"),
    body("description"),
    body("itvDueDate"),
    body("insuranceDueDate"),
    body("nextPreventiveMaintenance"),
    body("idCenter"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("vehicles")
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

// EDIT VEHICLE
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

    knex("vehicles")
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

  knex("vehicles")
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
