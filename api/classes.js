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
  [
    query("teacherID").optional(),
    query("centerID").optional(),
  ],
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    var { disponibility = null, teacherID = null, centerID = null } = req.query;

    var getQuery = knex
      .table("class_types")
      .leftJoin("generated_classes as gc", "gc.idClassType", "class_types.id")
      .leftJoin("teachers", "teachers.id", "gc.idTeacher");

    if ("Todos" !== teacherID) {
      getQuery.where("teachers.id", "=", teacherID);
    }

    if ("Libres" === disponibility) {
      getQuery.where("gc.reserved", "=", 0);
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

    const centerMaxPrice = await knex("centers")
      .select("centers.maxPrice")
      .where("centers.id", centerID)
      .first();

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

    console.log(startDate, "startDate");
    console.log(data, "data me viene");

    // Calculo el maximo precio de una clase para el centro
    const centerMaxPrice = await knex("centers")
      .select("centers.maxPrice")
      .where("centers.id", idCenter)
      .first();

    // Traigo las horas a las que el profesor va a dar clase

    const teacherTimes = await knex("teacher_schedules")
      .leftJoin("teachers", "teacher_schedules.idTeacher", "teachers.id")
      .leftJoin("centers", "teachers.idCenter", "centers.id")
      .where("teacher_schedules.active", 1)
      .andWhere("teacher_schedules.idTeacher", teacherID)
      .andWhere("teacher_schedules.hour", ">=", startHour)
      .andWhere("teacher_schedules.hour", "<=", endHour);

    if (teacherTimes.length == 0) {
      return res.json({ result: "No hay clases nuevas" });
    }

    const classesToInsert = [];
    const finalDay = moment(endDate).add(1, "days");
    for (
      let i = moment(startDate).format("YYYY-MM-DD");
      i < moment(finalDay).format("YYYY-MM-DD");
      i = moment(i).add(1, "days").format("YYYY-MM-DD")
    ) {
      console.log(moment(i).day(), "dia que guardare fechas");
      if (moment(i).day() === 6 || moment(i).day() === 0) {
        console.log(i, "es finde y no guardo fechas");
      } else {
        teacherTimes.length > 0 &&
          teacherTimes.forEach(async (time) => {
            console.log(time.hour, "hora dentro de cada dia");
            const newClass = {
              price: centerMaxPrice.maxPrice,
              reserved: 0,
              idClassType: 1,
              startHour: time.hour,
              date: i,
              idTeacher: teacherID,
              created_at: new Date(),
              updated_at: new Date(),
            };
            classesToInsert.push(newClass);
          });
        console.log(i, "dia");
      }
    }
    if (classesToInsert.length > 0) {
      console.log(classesToInsert, "clases a insertar");
      return await knex("generated_classes")
        .insert(classesToInsert)
        .then((res) => {
          console.log("introducida", res);
          return res.json({ message: "Creadas" });
        })
        .catch((err) => {
          return res.json({ result: "error" });
        });
    } else {
      return "No hay clases nuevas";
    }
  }
);

// EDIT CLASS
router.post(
  "/edit/:classID",
  [
    param("classID").isInt().toInt(),
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
      classID = null,
      centerID = null,
      idClassType = null,
      idTeacher = null,
      studentID = null,
      price = null,
      date = null,
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
    console.log(idClassType, "tipo de clase");
    knex("generated_classes")
      .update({
        idStudent: studentID,
        price: price,
        reserved: reserved,
        idClassType: idClassType,
        startHour: startHour,
        date: date,
        idTeacher: idTeacher,
        updated_at: new Date(),
      })
      .where("generated_classes.id", classID)
      .then(([newID]) => {
        console.log("la cambia");
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
