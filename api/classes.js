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
  "/create-one",
  [
    body("idClassType").toInt(),
    body("centerID").toInt(),
    body("idTeacher").toInt(),
    body("studentID"),
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
      centerID = null,
      idClassType = null,
      idTeacher = null,
      studentID = null,
      startDate = null,
      startHour = null,
    } = data;

    console.log(centerID, "center ID");

    const centerMaxPrice = await knex("centers")
      .select("centers.maxPrice")
      .where("centers.id", centerID)
      .first();

    console.log(centerMaxPrice, "maxPrice center");

    let reserved = studentID ? 1 : 0;

    let pvpPracticalClass = null;

    if (studentID !== null) {
      const studentClassesLeft = studentID
        ? await knex("student_class_bags")
            .select("quantity")
            .where("student_class_bags.idStudent", studentID)
            .first()
        : null;

      const course = await knex("courses")
        .select("courses.idtariff")
        .where("courses.idStudent", studentID)
        .first();

      pvpPracticalClass = await knex("tariffs")
        .select("tariffs.pvpPracticalClass")
        .where("id", course.idtariff)
        .first();

      if (studentClassesLeft.quantity > 0) {
        let newStudentClassesLeft = studentClassesLeft.quantity - 1;

        await knex("student_class_bags")
          .update({ quantity: newStudentClassesLeft, updated_at: new Date() })
          .where("student_class_bags.idStudent", studentID);
      } else {
        await knex("payments").insert({
          idStudent: studentID,
          description: "Clase práctica 45 min",
          quantity: pvpPracticalClass.pvpPracticalClass,
          type: "Cargo",
          date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    knex("generated_classes")
      .insert({
        idStudent: studentID,
        price: pvpPracticalClass
          ? pvpPracticalClass.pvpPracticalClass
          : centerMaxPrice.maxPrice,
        reserved: reserved,
        idClassType: idClassType,
        startHour: startHour,
        date: startDate,
        idTeacher: idTeacher,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .then(([newID]) => {
        knex("practical_classes")
          .insert({
            idGeneratedClass: newID,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .then(([idPracticalCLass]) => {
            return res.json({ idPracticalCLass });
          });
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
    body("price"),
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
      centerID = null,
      idClassType = null,
      idTeacher = null,
      studentID = null,
      price = null,
      startDate = null,
      startHour = null,
    } = data;

    const centerMaxPrice = await knex("centers")
      .select("centers.maxPrice")
      .where("centers.id", centerID)
      .first();

    console.log(centerMaxPrice, "maxPrice center");

    let reserved = studentID ? 1 : 0;

    let pvpPracticalClass = null;

    if (studentID !== null) {
      const studentClassesLeft = studentID
        ? await knex("student_class_bags")
            .select("quantity")
            .where("student_class_bags.idStudent", studentID)
            .first()
        : null;

      const course = await knex("courses")
        .select("courses.idtariff")
        .where("courses.idStudent", studentID)
        .first();

      pvpPracticalClass = await knex("tariffs")
        .select("tariffs.pvpPracticalClass")
        .where("id", course.idtariff)
        .first();

      if (studentClassesLeft.quantity > 0) {
        let newStudentClassesLeft = studentClassesLeft.quantity - 1;

        await knex("student_class_bags")
          .update({ quantity: newStudentClassesLeft, updated_at: new Date() })
          .where("student_class_bags.idStudent", studentID);
      } else {
        await knex("payments").insert({
          idStudent: studentID,
          description: "Clase práctica 45 min",
          quantity: price,
          type: "Cargo",
          date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    knex("generated_classes")
      .update({
        idStudent: studentID,
        price: price,
        reserved: reserved,
        idClassType: idClassType,
        startHour: startHour,
        date: startDate,
        idTeacher: idTeacher,
        updated_at: new Date(),
      })
      .then(([newID]) => {
        // knex("practical_classes")
        //   .update({
        //     idGeneratedClass: newID,
        //     created_at: new Date(),
        //     updated_at: new Date(),
        //   })
        //   .then(([idPracticalCLass]) => {
        //   });
        return res.json({ newID });
      })
      .catch((err) => {
        return res.status(500).send(err);
      });
  }
);

// CREAR VARIAS CLASES A LA VEZ
router.post(
  "/create-multiple",
  [
    body("idCenter").toInt(),
    body("teacherID").toInt(),
    body("startDate").toDate(),
    body("startHour"),
    body("endDate").toDate(),
    body("endHour"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req, { includeOptionals: true });

    let {
      idCenter = null,
      teacherID = null,
      startDate = null,
      startHour = null,
      endDate = null,
      endHour = null,
    } = data;

    // knex("generated_classes")
    //   .insert({
    //     idClassType: idClassType,
    //     startHour: startHour,
    //     date: startDate,
    //     idTeacher: idTeacher,
    //     idStudent: idStudent,
    //     reserved: 0,
    //     price: 20,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   })
    //   .then(([newID]) => {
    //     return res.json({ newID });
    //   })
    //   .catch((err) => {
    //     return res.status(500).send(err);
    //   });

    return "Generadas";
  }
);

// CENTRO ANULA CLASE
router.post(
  "/class-cancel/:classID",
  [param("classID").isInt().toInt(), body("studentID").toInt()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const data = matchedData(req, { includeOptionals: true });

    let { classID = null, studentID = null } = data;

    console.log(data, "data");

    if (studentID !== null) {
      const studentClassesLeft = await knex("student_class_bags")
        .select("quantity")
        .where("student_class_bags.idStudent", studentID)
        .first();

      const newStudentClassesLeft = studentClassesLeft.quantity + 1;

      await knex("student_class_bags")
        .update({ quantity: newStudentClassesLeft, updated_at: new Date() })
        .where("student_class_bags.idStudent", studentID);
    }

    return knex("generated_classes")
      .update({
        idStudent: null,
        reserved: 0,
        updated_at: new Date(),
      })
      .where("generated_classes.id", classID)
      .then(([newID]) => {
        console.log("se cancela");
        res.json({ result: "Anulada" });
      })
      .catch((err) => {
        return res.status(500).send(err);
      });
  }
);

module.exports = router;
