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
    // defaultGetValidators,
    (req, res) => {
      // HABRA QUE ANADIR FILTROS PARA FILTRAR POR CENTRO O SACAR TODOS
      const query = knex("vehicles")
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
        .then((results) => {
          return res.json({
            results,
          });
        })
        .catch((error) => res.status(500).send(JSON.stringify(error)));
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
      .update({
        enrollment: data.enrollment,
        description: data.description,
        itvDueDate: data.itvDueDate,
        insuranceDueDate: data.insuranceDueDate,
        nextPreventiveMaintenance: data.nextPreventiveMaintenance,
        idCenter: data.idCenter,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .where("id", data.ID)
      .then(result => {
        if (result > 0) {
          return res.send(`Updated`);
        }
        return res.status(404).send("Not found");
      })
      .catch(err => {
        return res.status(500).send(err);
      })
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
