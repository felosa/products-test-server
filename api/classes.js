const express = require("express");
const {
  query,
  validationResult,
  matchedData,
  param,
  body,
} = require("express-validator");
const knex = require("../db/knex"); //the connection
const moment = require("moment");

const router = express.Router();

router.get(
  "/",
  [query("teacherID").optional(), query("centerID").optional()],
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    var { teacherID = null, centerID = null } = req.query;

    var getQuery = knex
      .table("class_types")
      .leftJoin("generated_classes as gc", "gc.idClassType", "class_types.id")
      .leftJoin("teachers", "teachers.id", "gc.idTeacher");

    if ("Todos" !== teacherID) {
      getQuery.where("teachers.id", "=", teacherID);
    }
    var results = await getQuery.select({
      id: "gc.id",
      title: "class_types.description",
      idClassType: "gc.idClassType",
      class: "gc.reserved",
      idStudent: "gc.idStudent",
      idTeacher: "gc.idTeacher",
      price: "gc.price",
      date: "gc.date",
      start: "gc.startHour",
      duration: "class_types.duration",
      idCenter: "teachers.idCenter",
    });

    return res.json({
      results: results.map((elem) => {
        const newDate = moment(elem.date).format("YYYY-MM-DD");
        const newStart = moment(`${newDate}T${elem.start}`).format(
          "YYYY-MM-DDTHH:mm:ss"
        );
        const newEnd = moment(newStart)
          .add(elem.duration, "minutes")
          .format("YYYY-MM-DDTHH:mm:ss");
        elem["start"] = newStart;
        elem["end"] = newEnd;
        elem.class === 1
          ? (elem.class = "reservada")
          : (elem.class = "sin_reserva");
        return elem;
      }),
    });
  }
);

// CREAR CLASE
router.post(
  "/",
  [
    body("idClassType").toInt(),
    body("idTeacher").toInt(),
    body("idStudent"),
    body("startDate").toDate(),
    body("startHour"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req, { includeOptionals: true });

    let {
      idClassType = null,
      idTeacher = null,
      idStudent = null,
      startDate = null,
      startHour = null,
    } = data;

    console.log(data, "data");

    let reserved = idStudent ? 1 : 0;

    knex("generated_classes")
      .insert({
        idClassType: idClassType,
        startHour: startHour,
        date: startDate,
        idTeacher: idTeacher,
        idStudent: idStudent,
        reserved: reserved,
        price: 20,
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

// EDIT CLASS
router.post(
  "/:ID",
  [
    param("ID").isInt().toInt(),
    body("idClassType").toInt(),
    body("idTeacher").toInt(),
    body("studentID"),
    body("date").toDate(),
    body("startHour"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    let {
      idClassType = null,
      idTeacher = null,
      studentID = null,
      date = null,
      startHour = null,
    } = data;

    console.log(data, "data");

    let reserved = studentID ? 1 : 0;

    knex("generated_classes")
      .update({
        idClassType: idClassType,
        startHour: startHour,
        date: date,
        idTeacher: idTeacher,
        idStudent: studentID,
        reserved: reserved,
        // price: 20,
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
