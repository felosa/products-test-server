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

module.exports = router;
