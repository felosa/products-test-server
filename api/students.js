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
const e = require("express");
const moment = require("moment");

const router = express.Router();

// GET ALL
router.get(
  "/",
  [
    query("q").optional(),
    query("centerID").optional(),
    query("startDate").optional(),
    query("endDate").optional(),
    query("search").optional(),
    query("orderBy").optional({ nullable: true }),
    query("orderDir").isIn(["asc", "desc"]).optional({ nullable: true }),
    query("perPage").isInt({ min: 1, max: 100 }).toInt().optional(),
    query("page").isInt({ min: 1 }).toInt().optional(),
  ],
  // defaultGetValidators,
  async (req, res) => {
    // HABRA QUE ANADIR FILTROS PARA FILTRAR POR CENTRO O SACAR TODOS

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    var {
      q = null,
      centerID = null,
      startDate = null,
      endDate = null,
      orderBy = null,
      orderDir = null,
      perPage = 10,
      page = 1,
    } = req.query;

    var getQuery = knex
      .table("students")
      .leftJoin("courses", "courses.idStudent", "students.id")
      .orderBy("students.created_at", "desc");

    if (centerID) {
      getQuery.where("students.idCenter", centerID);
    }
    if (null !== q) {
      getQuery.where("students.firstName", "LIKE", `%${q}%`);
    }

    if (null !== startDate) {
      getQuery.where("courses.signUp", ">=", new Date(startDate));
    }
    if (null !== endDate) {
      console.log("entra");
      getQuery.where("courses.signUp", "<=", new Date(endDate));
    }

    var totalCount = await getQuery
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQuery
      .limit(perPage)
      .offset((page - 1) * perPage)
      .leftJoin("centers", "centers.id", "students.idCenter")
      .select(
        "students.id",
        "students.registerNumber",
        "students.dni",
        "students.dniExpiration",
        "students.firstName",
        "students.lastName1",
        "students.lastName2",
        "students.email",
        "students.phone",
        "students.gender",
        "students.wayType",
        "students.wayName",
        "students.wayNumber",
        "students.block",
        "students.floor",
        "students.door",
        "students.postalCode",
        "students.city",
        "students.province",
        "students.nationality",
        "students.countryBirth",
        "students.birthday",
        "students.medicalExamination",
        "students.how",
        "students.firstContact",
        "students.recieveNotifications",
        "students.active",
        "students.completeCourse",
        "students.lastAccess",
        "students.app",
        "students.notified",
        "students.observations",
        "students.isOther",
        "students.created_at",
        "students.updated_at",
        "students.idCenter as centerID",
        "centers.name as centerName",
        "courses.signUp",
        "courses.startDate",
        "courses.practice",
        "courses.theory",
        "courses.permission"
      );



    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);

router.get(
  "/get-exams",
  [
    query("studentID").optional(),
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
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      studentID = null,
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
    console.log(studentID, "studentID");

    let getQueryExams = knex
      .table("student_exams")
      .where("student_exams.idStudent", studentID);

    var totalCount = await getQueryExams
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQueryExams
      .limit(perPage)
      .offset((page - 1) * perPage)
      .select()
      .leftJoin("exams", "exams.id", "student_exams.idExam");

    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);

router.get(
  "/get-practical",
  [
    query("studentID").optional(),
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
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      studentID = null,
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
    console.log(studentID, "studentID");

    let getQueryExams = knex
      .table("generated_classes")
      .where("generated_classes.idStudent", studentID);

    var totalCount = await getQueryExams
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQueryExams
      .limit(perPage)
      .offset((page - 1) * perPage)
      .select()
      .leftJoin("teachers", "teachers.id", "generated_classes.idTeacher")
      .leftJoin(
        "practical_classes",
        "practical_classes.idGeneratedClass",
        "generated_classes.id"
      );

    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);
router.get(
  "/get-payments",
  [
    query("studentID").optional(),
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
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      studentID = null,
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
    console.log(studentID, "studentID");

    let getQueryExams = knex
      .table("payments")
      .where("payments.idStudent", studentID)
      .where("payments.active", 1)
      .orderBy("payments.date", "desc");

    var totalCount = await getQueryExams
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQueryExams
      .limit(perPage)
      .offset((page - 1) * perPage)
      .select();

    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);

router.get(
  "/get-sum-payments",
  [
    query("studentID").optional(),
    query("search").optional(),
    query("orderBy").optional({ nullable: true }),
    query("orderDir").isIn(["asc", "desc"]).optional({ nullable: true }),
    query("perPage").isInt({ min: 1, max: 100 }).toInt().optional(),
    query("page").isInt({ min: 1 }).toInt().optional(),
  ],
  // defaultGetValidators,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      studentID = null,
      orderBy = null,
      orderDir = null,
      perPage = 10,
      page = 1,
    } = req.query;
    console.log(studentID, "studentID");

    return (studentPayments = await knex
      .table("payments")
      .where("payments.idStudent", studentID)
      .where("payments.active", 1)
      .select()
      .then(async (results) => {
        const sumarize = await results.reduce((accumulator, obj) => {
          if (!accumulator[obj["description"]]) {
            accumulator[obj["description"]] = {
              description: obj["description"],
              charge: 0,
              payment: 0,
              total: 0,
            };
          }
          obj["type"] === "Cargo"
            ? (accumulator[obj["description"]].charge += obj["quantity"])
            : (accumulator[obj["description"]].payment += obj["quantity"]);

          accumulator[obj["description"]].total =
            accumulator[obj["description"]].payment -
            accumulator[obj["description"]].charge;

          return accumulator;
        }, {});
        const parseToArray = Object.values(sumarize);
        const total = parseToArray.reduce((total, actual) => {
          return total + actual.total;
        }, 0);
        return res.json({
          results: parseToArray,
          total: total,
        });
      }));
  }
);

// GET ONE

router.get(
  "/:studentID",
  [param("studentID").isInt().toInt()],
  async (req, res) => {
    try {
      const { studentID } = matchedData(req);
      console.log(studentID, "req");
      const studentQuery = knex("students")
        .leftJoin("centers", "centers.id", "students.idCenter")
        .select(
          "students.id",
          "students.registerNumber",
          "students.dni",
          "students.dniExpiration",
          "students.firstName",
          "students.lastName1",
          "students.lastName2",
          "students.email",
          "students.phone",
          "students.gender",
          "students.wayType",
          "students.wayName",
          "students.wayNumber",
          "students.block",
          "students.floor",
          "students.door",
          "students.postalCode",
          "students.city",
          "students.province",
          "students.nationality",
          "students.countryBirth",
          "students.birthday",
          "students.medicalExamination",
          "students.how",
          "students.firstContact",
          "students.recieveNotifications",
          "students.active",
          "students.completeCourse",
          "students.lastAccess",
          "students.app",
          "students.notified",
          "students.observations",
          "students.isOther",
          "students.created_at",
          "students.updated_at",
          "students.idCenter as centerID",
          "centers.name as centerName"
        )
        .where("students.id", studentID)
        .first()
        // SELECCIONAR ROL?
        .leftJoin("user_rols as rol", "centers.id", "rol.idEntity")
        .where("students.id", studentID)
        .first();

      const rolQuery = knex("user_rols")
        .leftJoin("users", "users.id", "user_rols.idUser")
        .select("role", "idUser")
        .where("idEntity", studentID)
        .first();

      return Promise.all([studentQuery, rolQuery])
        .then(([student, rol]) => {
          console.log(student, "centro");
          if (!student) {
            return res.status(401).send("Not found");
          }
          student["rol"] = rol;
          return res.json(student);
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

// CREAR STUDENT
router.post(
  "/",
  [
    body("idCenter").toInt(),
    body("registerNumber"),
    body("dni"),
    body("dniExpiration"),
    body("firstName"),
    body("lastName1"),
    body("lastName2"),
    body("email"),
    body("phone"),
    body("gender"),
    body("wayType"),
    body("wayName"),
    body("wayNumber"),
    body("block"),
    body("floor"),
    body("door"),
    body("postalCode"),
    body("city"),
    body("province"),
    body("nationality"),
    body("countryBirth"),
    body("birthday"),
    body("medicalExamination"),
    body("how"),
    body("firstContact"),
    body("recieveNotifications"),
    body("active"),
    body("password"),
    body("permission"),
    body("idTariff"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    var idStudent;

    bcrypt.genSalt(10).then((salt, err) => {
      if (err) {
        this.logger.logError(err, "registerUser");

        reject(err);
      }

      bcrypt.hash(data.dni, salt).then(async (hash, err) => {
        if (err) {
          this.logger.logError(err, "registerUser");

          reject(err);
        }

        var studentQuery = new Promise((resolve) => {
          knex("students")
            .insert({
              registerNumber: 1,
              dni: data.dni,
              dniExpiration: data.dniExpiration,
              firstName: data.firstName,
              lastName1: data.lastName1,
              lastName2: data.lastName2,
              email: data.email,
              phone: data.phone,
              gender: data.gender,
              wayType: data.wayType,
              wayName: data.wayName,
              wayNumber: data.wayNumber,
              block: data.block,
              floor: data.floor,
              door: data.door,
              postalCode: data.postalCode,
              city: data.city,
              province: data.province,
              nationality: "data.nationality",
              countryBirth: "data.countryBirth",
              birthday: "2020-02-02",
              medicalExamination: data.medicalExamination,
              how: "data.how",
              recieveNotifications: 1,
              idCenter: data.idCenter,
              active: 1,
              firstContact: "a",
              password: "data.password",
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then((studentID) => {
              idStudent = studentID;
              console.log(studentID, "id del student");
              resolve(studentID);
            })
            .catch((error) => {
              console.log("no lo ha guardado por fallo del student");
              resolve();
            });
        });

        console.log(hash, "contrasena");

        var userQuery = new Promise((resolve) => {
          knex("users")
            .insert({
              // pasar para el user a coger la inicial del nombre y el priemr apellido
              user: data.email,
              password: hash,
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then((userID) => {
              console.log(userID, "id del user en user table");
              resolve(userID);
            })
            .catch((error) => {
              console.log("no lo ha guardado por fallo del user");
              resolve();
            });
        });

        var classBagQuery = await knex.table("student_class_bags").insert({
          idStudent: idStudent,
          quantity: 0,
        });

        var courseQuery = await knex.table("courses").insert({
          signUp: data.signUp,
          startDate: data.startDate,
          endDate: data.endDate,
          // logica para felicitationBirthday y las demas que vienen
          felicitationBirthday: data.birthday,
          twoMonths: data.birthday,
          endDateBad: data.birthday,
          permission: data.permission,
          idTariff: data.idTariff,
          practiceSent: 0,
        });

        const payment1 = await knex
          .table("payments")
          .leftJoin("tariffs", "tariffs.id", data.idTariff)
          .insert({
            description: "Matrícula",
            idStudent: idStudent,
            quantity: tariffs.pvpSignUp,
            type: "Cargo",
            paymentType: null,
            date: new Date(),
          });

        const payment2 = await knex
          .table("payments")
          .leftJoin("tariffs", "tariffs.id", data.idTariff)
          .insert({
            description: "Curso Teórico",
            idStudent: idStudent,
            quantity: tariffs.pvpCourse,
            type: "Cargo",
            paymentType: null,
            date: new Date(),
          });
        // Cuando las anteriores se han creado, meter el id del usuario en idUser, y el id del student(tabla students) en idEntity

        return Promise.all([studentQuery, userQuery])
          .then((results) => {
            console.log(results, "resultados finales");
            let newStudentID = results[0];
            knex("user_rols")
              .insert({
                idUser: results[1], // id de Usuario en user table
                idEntity: results[0], // id de student en Student table
                role: "ROLE_STUDENT",
                created_at: new Date(),
                updated_at: new Date(),
              })
              .then((response) => {
                return knex("student_class_bags")
                  .insert({
                    idStudent: newStudentID,
                    quantity: 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                  })
                  .then((response) => {
                    res.json({
                      results: response,
                    });
                  });
              });
          })
          .catch((error) => console.log("error"));
      });
    });
  }
);

// EDIT
router.post(
  "/:ID",
  [
    param("ID").isInt().toInt(),
    body("idCenter"),
    body("registerNumber"),
    body("dni"),
    body("dniExpiration"),
    body("firstName"),
    body("LastName1"),
    body("LastName2"),
    body("email"),
    body("phone"),
    body("gender"),
    body("wayType"),
    body("wayName"),
    body("wayNumber"),
    body("block"),
    body("floor"),
    body("door"),
    body("postalCode"),
    body("city"),
    body("province"),
    body("nationality"),
    body("countryBirth"),
    body("birthday"),
    body("medicalExamination"),
    body("how"),
    body("firstContact"),
    body("recieveNotifications"),
    body("active"),
    body("rol"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    // ID = id del estudiante en la tabla estudiantes
    // identityID = id que tiene el estudiante en la tabla user
    const data = matchedData(req, { includeOptionals: true });
    data.identityID = data.rol.idUser;
    if (data.dni) {
      bcrypt.genSalt(10).then((salt, err) => {
        if (err) {
          this.logger.logError(err, "registerUser");

          reject(err);
        }

        bcrypt.hash(data.dni, salt).then((hash, err) => {
          if (err) {
            this.logger.logError(err, "registerUser");

            reject(err);
          }

          var studentQuery = new Promise((resolve) => {
            knex("students")
              .update({
                registerNumber: data.registerNumber,
                dni: data.dni,
                dniExpiration: data.dniExpiration,
                firstName: data.firstName,
                LastName1: data.LastName1,
                LastName2: data.LastName2,
                email: data.email,
                phone: data.phone,
                gender: data.gender,
                wayType: data.wayType,
                wayName: data.wayName,
                wayNumber: data.wayNumber,
                block: data.block,
                floor: data.floor,
                door: data.door,
                postalCode: data.postalCode,
                city: data.city,
                province: data.province,
                nationality: data.nationality,
                countryBirth: data.countryBirth,
                birthday: data.birthday,
                medicalExamination: data.medicalExamination,
                how: data.how,
                recieveNotifications: data.recieveNotifications,
                idCenter: data.idCenter,
                active: data.active,
                firstContact: data.firstContact,
                updated_at: new Date(),
              })
              .where("id", data.ID)
              .then((result) => {
                if (result > 0) {
                  resolve(result);
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
                user: data.email,
                password: hash,
                created_at: new Date(),
                updated_at: new Date(),
              })
              .where("id", data.identityID)
              .then((userID) => {
                console.log(userID, "id del user");
                resolve(userID);
              })
              .catch((error) => {
                console.log("no lo ha guardado por fallo del user");
                resolve();
              });
          });
        });
      });
    } else {
      var studentQuery = new Promise((resolve) => {
        knex("students")
          .update({
            registerNumber: data.registerNumber,
            dni: data.dni,
            dniExpiration: data.dniExpiration,
            firstName: data.firstName,
            LastName1: data.LastName1,
            LastName2: data.LastName2,
            email: data.email,
            phone: data.phone,
            gender: data.gender,
            wayType: data.wayType,
            wayName: data.wayName,
            wayNumber: data.wayNumber,
            block: data.block,
            floor: data.floor,
            door: data.door,
            postalCode: data.postalCode,
            city: data.city,
            province: data.province,
            nationality: data.nationality,
            countryBirth: data.countryBirth,
            birthday: data.birthday,
            medicalExamination: data.medicalExamination,
            how: data.how,
            recieveNotifications: data.recieveNotifications,
            idCenter: data.idCenter,
            active: data.active,
            firstContact: data.firstContact,
            updated_at: new Date(),
          })
          .where("id", data.ID)
          .then((result) => {
            if (result > 0) {
              resolve(result);
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
            user: data.email,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .where("id", data.identityID)
          .then((userID) => {
            console.log(userID, "id del user");
            resolve(userID);
          })
          .catch((error) => {
            console.log("no lo ha guardado por fallo del user");
            resolve();
          });
      });
    }

    return Promise.all([studentQuery, userQuery]).then((results) => {
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

  knex("students")
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
