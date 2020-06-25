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

const router = express.Router();

// GET ALL
router.get(
  "/",
  // defaultGetValidators,
  (req, res) => {
    // HABRA QUE ANADIR FILTROS PARA FILTRAR POR CENTRO O SACAR TODOS
    const query = knex("students")
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
      .then((results) => {
        return res.json({
          results,
        });
      })
      .catch((error) => res.status(500).send(JSON.stringify(error)));

    // return Promise.all([query, countQuery])
    //   .then(([results, count]) => {
    //     return res.json({
    //       page: criteria.page || 1,
    //       perPage: criteria.perPage || 10,
    //       totalResults: count.totalResults,
    //       results,
    //     });
    //   })
    //   .catch((error) => res.status(500).send(JSON.stringify(error)));
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
      var studentQuery = knex("students")
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
    body("password"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    console.log(data, "center");
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
            .insert({
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
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then((studentID) => {
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
              console.log(userID, "id del user");
              resolve(userID);
            })
            .catch((error) => {
              console.log("no lo ha guardado por fallo del user");
              resolve();
            });
        });
        console.log(userQuery, "userQuery");
        // Cuando las anteriores se han creado, meter el id del usuario en idUser, y el id del centro en idEntity

        return Promise.all([studentQuery, userQuery]).then((results) => {
          console.log(results, "resultados finales");

          knex("user_rols")
            .insert({
              idUser: results[1], // id de Usuario
              idEntity: results[0], // id de Teacher
              role: "ROLE_STUDENT",
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then((response) => {
              return res.json({
                results: response,
              });
            });
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
    body("identityID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

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
