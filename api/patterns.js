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

// TODOS LOS PATRONES
router.get("/", [query("teacherID").optional()], async (req, res) => {
  // HABRA QUE ANADIR FILTROS PARA FILTRAR POR CENTRO O SACAR TODOS
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  var { teacherID = null } = req.query;

  return knex
    .table("teacher_schedules")
    .orderBy("teacher_schedules.hour", "asc")
    .select()
    .where("teacher_schedules.idTeacher", teacherID)
    .then((results) => {
      return res.json(results);
    });
});

// GET ONE VEHICLE
// router.get(
//   "/:vehicleID",
//   [param("vehicleID").isInt().toInt()],
//   async (req, res) => {
//     try {
//       const { vehicleID } = matchedData(req);
//       console.log(vehicleID, "req");
//       var vehicleQuery = knex("teacher_schedules")
//         .leftJoin("centers", "centers.id", "teacher_schedules.idCenter")
//         .select(
//           "teacher_schedules.id",
//           "teacher_schedules.enrollment",
//           "teacher_schedules.description",
//           "teacher_schedules.itvDueDate",
//           "teacher_schedules.insuranceDueDate",
//           "teacher_schedules.nextPreventiveMaintenance",
//           "teacher_schedules.idCenter",
//           "centers.name as centerName"
//         )
//         .where("teacher_schedules.id", vehicleID)
//         .first()
//         .then((result) => {
//           return res.json(result);
//         })
//         .catch((error) => {
//           console.log(error);
//           return res.status(500).send("Error");
//         });
//     } catch (error) {
//       console.log(error);
//       return res.status(500).send("Error");
//     }
//   }
// );

// CREAR PATTERN
router.post(
  "/",
  [body("teacherID"), body("hour"), body("active")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("teacher_schedules")
      .insert({
        active: 1,
        hour: data.hour,
        idTeacher: data.teacherID,
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

// EDIT PATTERN
router.post(
  "/:ID",
  [param("ID").isInt().toInt(), body("active")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });
    let newState = parseInt(data.active);
    console.log(data, newState, "respuestas");

    knex("teacher_schedules")
      .update({
        active: newState,
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

  knex("teacher_schedules")
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
