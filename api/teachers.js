const express = require("express");
const {
  query,
  validationResult,
  matchedData,
  param,
  body,
} = require("express-validator");
const knex = require("../db/knex"); //the connection
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const router = express.Router();

router.get(
  "/classes",
  [query("teacherID").optional()],
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    var { teacherID = null } = req.query;

    return (getQuery = await knex
      .table("class_types")
      .leftJoin("generated_classes as gc", "gc.idClassType", "class_types.id")
      .select({
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
      })
      .where("gc.idTeacher", teacherID)
      .then((classes) => {
        const finalClasses = classes.map((elem) => {
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
        });

        return res.json({
          results: finalClasses,
        });
      }));
  }
);

// GET CLASS BY ID
router.get(
  "/classID",
  [query("classID").optional()],
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    var { classID = null } = req.query;

    const getQuery = await knex
      .table("class_types")
      .leftJoin("generated_classes as gc", "gc.idClassType", "class_types.id")
      .select({
        id: "gc.id",
        title: "class_types.description",
        idClassType: "gc.idClassType",
        class: "gc.reserved",
        studentID: "gc.idStudent",
        idTeacher: "gc.idTeacher",
        price: "gc.price",
        date: "gc.date",
        startHour: "gc.startHour",
        duration: "class_types.duration",
      })
      .where("gc.id", classID)
      .first();

    return res.json({
      results: getQuery,
    });
  }
);

router.get(
  "/get-export-classes",
  [
    query("teacherID").optional(),
    query("startDate").optional(),
    query("endDate").optional(),
    query("perPage").isInt({ min: 1, max: 1000 }).toInt().optional(),
    query("page").isInt({ min: 1 }).toInt().optional(),
  ],
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      view = "listing",
      teacherID = null,
      startDate = null,
      endDate = null,
    } = req.query;

    let getTeacherClassesQuery = knex
      .table("class_types")
      .leftJoin(
        "generated_classes",
        "generated_classes.idClassType",
        "class_types.id"
      )
      .leftJoin("teachers", "teachers.id", "generated_classes.idTeacher")
      .where("teachers.id", teacherID);
    console.log(startDate, endDate, "fechas");
    if (null !== startDate) {
      getTeacherClassesQuery.where(
        "generated_classes.date",
        ">=",
        new Date(startDate)
      );
    }
    if (null !== endDate) {
      getTeacherClassesQuery.where(
        "generated_classes.date",
        "<=",
        new Date(endDate)
      );
    }

    var teacher = await knex("teachers")
      .select("teachers.firstName as Nombre", "teachers.lastName1 as Apellido")
      .where("teachers.id", teacherID);

    var results = await getTeacherClassesQuery

      .select(
        "firstName as Nombre",
        "lastName1 as Apellidos",
        "description as Descripción",
        "class_types.duration as Duración"
      )
      .count("*", { as: "Unidades" })
      .groupBy("teachers.id", "class_types.id");

    return res.json({
      teacherName: `${teacher[0]["Nombre"]}-${teacher[0]["Apellido"]}`,
      data: results,
    });
  }
);

// TODOS LOS PROFESORES
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
    } = req.query;

    var getQuery = knex
      .table("teachers")
      .orderBy("teachers.created_at", "desc");

    if (centerID) {
      getQuery.where("teachers.idCenter", centerID);
    }

    var totalCount = await getQuery
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQuery
      .limit(perPage)
      .offset((page - 1) * perPage)
      .leftJoin("centers", "centers.id", "teachers.idCenter")
      .select(
        "teachers.id",
        "teachers.firstName",
        "teachers.lastName1",
        "teachers.lastName2",
        "teachers.dni",
        "teachers.phone",
        "teachers.email",
        "teachers.birthday",
        "teachers.created_at",
        "teachers.updated_at",
        "teachers.idCenter as centerID",
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

// GET ONE
router.get(
  "/:teacherID",
  [param("teacherID").isInt().toInt()],
  async (req, res) => {
    try {
      const { teacherID } = matchedData(req);
      var teacherQuery = knex("teachers")
        .leftJoin("centers", "centers.id", "teachers.idCenter")
        .select(
          "teachers.id",
          "teachers.firstName",
          "teachers.lastName1",
          "teachers.lastName2",
          "teachers.dni",
          "teachers.phone",
          "teachers.password",
          "teachers.email",
          "teachers.birthday",
          "teachers.teacherSignature",
          "teachers.created_at",
          "teachers.updated_at",
          "teachers.idCenter as centerID",
          "centers.name as centerName"
        )
        .where("teachers.id", teacherID)
        .first()
        // SELECCIONAR ROL?
        .leftJoin("user_rols as rol", "centers.id", "rol.idEntity")
        .where("teachers.id", teacherID)
        .first();

      const rolQuery = knex("user_rols")
        .leftJoin("users", "users.id", "user_rols.idUser")
        .select("role", "idUser")
        .where("idEntity", teacherID)
        .first();

      return Promise.all([teacherQuery, rolQuery])
        .then(async ([teacher, rol]) => {
          if (!teacher) {
            return res.status(401).send("Not found");
          }
          const userQuery = await knex("users")
            .select("users.user")
            .where("id", rol.idUser)
            .first()
            .then((response) => response);

          console.log(userQuery.user, "query user id");
          teacher["rol"] = rol;
          teacher["user"] = userQuery.user;
          return res.json(teacher);
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

// CREAR TEACHER
router.post(
  "/",
  [
    body("idCenter"),
    body("firstName"),
    body("lastName1"),
    body("lastName2"),
    body("dni"),
    body("phone"),
    body("email"),
    body("birthday").toDate(),
    body("password"),
    body("teacherSignature"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    let newPassword = null;

    if (data.dni) {
      newPassword = await bcrypt.genSalt(10).then((salt, err) => {
        if (err) {
          this.logger.logError(err, "registerUser");

          reject(err);
        }

        return bcrypt.hash(data.dni, salt).then((hash, err) => {
          if (err) {
            this.logger.logError(err, "registerUser");

            reject(err);
          }

          return hash;
        });
      });
    }

    var teacherQuery = new Promise((resolve) => {
      knex("teachers")
        .insert({
          firstName: data.firstName,
          lastName1: data.lastName1,
          lastName2: data.lastName2,
          dni: data.dni,
          phone: data.phone,
          email: data.email,
          birthday: data.birthday,
          password: data.dni,
          teacherSignature: data.teacherSignature,
          idCenter: data.idCenter,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .then((teacherID) => {
          resolve(teacherID);
        })
        .catch((error) => {
          console.log("no lo ha guardado por fallo del teacher");
          resolve();
        });
    });

    var userQuery = new Promise((resolve) => {
      knex("users")
        .insert({
          user: data.email,
          password: newPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .then((userID) => {
          console.log(userID, "id del user");
          resolve(userID);
        })
        .catch((error) => {
          console.log("no lo ha guardado por fallo del user");
          resolve();
        });
    });
    // Cuando las anteriores se han creado, meter el id del usuario en idUser, y el id del centro en idEntity

    return Promise.all([teacherQuery, userQuery]).then((results) => {
      knex("user_rols")
        .insert({
          idUser: results[1], // id de Usuario
          idEntity: results[0], // id de Teacher
          role: "ROLE_TEACHER",
          created_at: new Date(),
          updated_at: new Date(),
        })
        .then((response) => {
          return res.json({
            results: response,
          });
        });
    });
  }
);

// EDIT
router.post(
  "/:ID",
  [
    param("ID").isInt().toInt(),
    body("centerID"),
    body("firstName"),
    body("rol"),
    body("lastName1"),
    body("lastName2"),
    body("dni"),
    body("password"),
    body("phone"),
    body("email"),
    body("user"),
    body("birthday").toDate(),
    body("teacherSignature"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // ID = id del profesor en la tabla teachers
    // rol.idUser = id que tiene el profesor en la tabla user

    const data = matchedData(req, { includeOptionals: true });

    let newPassword = null;

    if (data.password) {
      newPassword = await bcrypt.genSalt(10).then((salt, err) => {
        if (err) {
          this.logger.logError(err, "registerUser");

          reject(err);
        }

        return bcrypt.hash(data.password, salt).then((hash, err) => {
          if (err) {
            this.logger.logError(err, "registerUser");

            reject(err);
          }

          return hash;
        });
      });
    }

    var teacherQuery = new Promise((resolve) => {
      knex("teachers")
        .update({
          firstName: data.firstName,
          lastName1: data.lastName1,
          lastName2: data.lastName2,
          dni: data.dni,
          phone: data.phone,
          email: data.email,
          birthday: data.birthday,
          password: data.password,
          teacherSignature: data.teacherSignature,
          idCenter: data.centerID,
          updated_at: new Date(),
        })
        .where("id", data.ID)
        .then((result) => {
          if (result > 0) {
            return res.send("Updated");
          }
          return res.status(404).send("Not found");
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    });

    var userQuery = new Promise((resolve) => {
      knex("users")
        .update({
          // pasar para el user a coger la inicial del nombre y el priemr apellido
          user: data.user,
          password: data.password ? newPassword : "",
          updated_at: new Date(),
        })
        .where("id", data.rol.idUser)
        .then((userID) => {
          console.log(userID, "id del user");
          resolve(userID);
        })
        .catch((error) => {
          console.log("no lo ha guardado por fallo del user");
          resolve();
        });
    });

    return Promise.all([teacherQuery, userQuery]).then((results) => {
      console.log(results, "resultados finales");
      return res.json({
        results: results,
      });
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

  knex("centers")
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
