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
    query("type").optional(),
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
      type = null,
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

    if (null !== type) {
      if (type === "Alumnos Activos") {
        getQuery.where("students.isOther", 0).andWhere("students.active", 1);
      } else if (type === "Alumnos Inactivos") {
        getQuery.where("students.isOther", 0).andWhere("students.active", 0);
      } else if (type === "Otros Activos") {
        getQuery.where("students.isOther", 1).andWhere("students.active", 1);
      } else if (type === "Otros Inactivos") {
        getQuery.where("students.isOther", 1).andWhere("students.active", 0);
      }
    }

    if (null !== startDate) {
      getQuery.where("courses.signUp", ">=", new Date(startDate));
    }
    if (null !== endDate) {
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

// TODOS LOS ALUMNOS PARA SELECCION EN CLASES PRACTICAS
router.get(
  "/class-selection",
  [query("centerID").optional()],
  // defaultGetValidators,
  async (req, res) => {
    const { centerID } = matchedData(req);
    return knex("students")
      .select(
        "students.id",
        "students.firstName",
        "students.lastName1",
        "students.lastName2",
        "students.dni"
      )
      .where("idCenter", centerID)
      .andWhere("active", 1)
      .then((results) => {
        const finalResults = results.map((elem, index) => {
          const name = `${elem.firstName} ${
            elem.lastName1 ? elem.lastName1 : ""
          } ${elem.lastName2 ? elem.lastName2 : ""} ${elem.dni}`;
          elem["name"] = name;
          return {
            id: elem.id,
            studentName: name,
          };
        });
        return res.json({
          results: finalResults,
        });
      })
      .catch((error) => res.status(500).send(JSON.stringify(error)));
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
    } = req.query;

    console.log(studentID, "id studiante");

    let query = knex
      .table("generated_classes")
      .where("generated_classes.idStudent", studentID);

    var totalCount = await query
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await query
      .limit(perPage)
      .offset((page - 1) * perPage)
      .select()
      .leftJoin("teachers", "teachers.id", "generated_classes.idTeacher")
      .leftJoin(
        "practical_classes",
        "practical_classes.idGeneratedClass",
        "generated_classes.id"
      )
      .orderBy("generated_classes.date", "desc");

    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);

const listingPayments = async (
  res,
  getQueryPayments,
  perPage,
  page,
  orderBy,
  orderDir
) => {
  var totalCount = await getQueryPayments
    .clone()
    .count("*", { as: "totalResults" })
    .limit(999999)
    .offset(0);

  var results = await getQueryPayments
    .limit(perPage)
    .offset((page - 1) * perPage)
    .select();

  return res.json({
    page: page || 1,
    perPage: perPage || 10,
    totalCount: totalCount[0].totalResults,
    results: results,
  });
};

const exportPayments = async (res, getQueryPayments, studentID) => {
  var student = await knex("students")
    .select("students.firstName as Nombre", "students.lastName1 as Apellido")
    .where("students.id", studentID);

  var results = await getQueryPayments
    .select(
      "payments.date as Fecha",
      "students.firstName as Nombre",
      "students.lastName1",
      "students.lastName2",
      "students.dni as DNI",
      "students.wayType",
      "students.wayName",
      "students.wayNumber",
      "students.block",
      "students.floor",
      "students.door",
      "students.postalCode",
      "students.city",
      "payments.description as Descripción",
      "payments.paymentType",
      "payments.quantity as importe",
      "payments.type as Tipo",
      "courses.permission"
    )
    .leftJoin("students", "students.id", "payments.idStudent")
    .leftJoin("courses", "courses.idStudent", "students.id");

  const formatResult = results.map((elem) => {
    if (elem["Tipo"] === "Cargo") {
      elem["Importe Cargo"] = elem["importe"];
      elem["Importe"] = 0;
    } else {
      elem["Importe Cargo"] = 0;
      elem["Importe"] = elem["importe"];
    }
    const newElem = {
      "Serie Factura": "",
      Fecha: moment(elem["Fecha"]).format("DD/MM/YYYY"),
      DNI: elem.DNI,
      Cliente: `${elem.Nombre} ${elem.lastName1} ${elem.lastName2}`,
      Dirección: `${elem.wayType} ${elem.wayName} ${elem.wayNumber} ${elem.block} ${elem.floor} ${elem.door}`,
      Localidad: `${elem.postalCode} ${elem.city}`,
      "Código artículo": "",
      Descripción: `${elem.permission} ${elem["Descripción"]}`,
      "F. Pago": elem["paymentType"],
      Importe: elem["Importe"],
      IVA: "i",
      "Importe Cargo": elem["Importe Cargo"],
    };
    return newElem;
  });

  return res.json({
    studentName: `${student[0]["Nombre"]}-${student[0]["Apellido"]}`,
    data: formatResult,
  });
};

router.get(
  "/get-payments",
  [
    query("studentID").optional(),
    query("view").optional(),
    query("search").optional(),
    query("startDate").optional(),
    query("endDate").optional(),
    query("orderBy").optional({ nullable: true }),
    query("orderDir").isIn(["asc", "desc"]).optional({ nullable: true }),
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
      studentID = null,
      startDate = null,
      endDate = null,
      orderBy = null,
      orderDir = null,
      perPage = 10,
      page = 1,
    } = req.query;

    let getQueryPayments = knex
      .table("payments")
      .where("payments.idStudent", studentID)
      .where("payments.active", 1)
      .orderBy("payments.date", "desc");

    if (null !== startDate) {
      getQueryPayments.where("payments.date", ">=", new Date(startDate));
    }
    if (null !== endDate) {
      getQueryPayments.where("payments.date", "<=", new Date(endDate));
    }

    switch (view) {
      case "listing":
        return listingPayments(
          res,
          getQueryPayments,
          perPage,
          page,
          orderBy,
          orderDir
        );

      case "export":
        return exportPayments(res, getQueryPayments, studentID);

      default:
        return res.status(404).send("View not found");
    }
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
      const studentQuery = knex("students")
        .leftJoin("centers", "centers.id", "students.idCenter")
        .select(
          "students.id as studentID",
          "students.registerNumber",
          "students.dni",
          "students.password",
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
          "courses.permission",
          "courses.signUp",
          "courses.startDate",
          "courses.endDateBad",
          "courses.reactivation1",
          "courses.reactivation2",
          "courses.endDate",
          "courses.theory",
          "courses.practice",
          "courses.practiceSent",
          "courses.practiceAdvice",
          "courses.idTariff as tariff",
          "rol.role",
          "rol.idUser as userID",
          "users.user as user",
          "classes.quantity as classes"
        )
        .where("students.id", studentID)
        .first()
        // SELECCIONAR ROL?
        .leftJoin("user_rols as rol", "rol.idEntity", "students.id")
        .where("rol.role", "ROLE_STUDENT")
        .leftJoin("users", "users.id", "rol.idUser")
        .leftJoin("courses", "courses.idStudent", "students.id")
        .leftJoin(
          "student_class_bags as classes",
          "classes.idStudent",
          "students.id"
        )
        .where("students.id", studentID)
        .first();

      return Promise.all([studentQuery])
        .then(([student]) => {
          if (!student) {
            return res.status(401).send("Not found");
          }

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
    body("dniExpiration").toDate(),
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
    body("birthday").toDate(),
    body("how"),
    body("firstContact"),
    body("recieveNotifications"),
    body("permission"),
    body("tariff"),
    body("completeCourse"),
    body("observations"),
    body("active"),
    body("isOther"),
    body("signUp").toDate(),
    body("startDate").toDate(),
    body("endDate").toDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    console.log(data, "data para guardar");

    // Crear codigo para la tabla users
    const code = `${data.firstName[0].toLowerCase()}${data.lastName1.toLowerCase()}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let newPassword = null;

    // Creo contrasena para la tabla users
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

    let registerNumber = null;

    // Creo un nuevo numero de registro del estudiante para la tabla estudiantes
    if (data.isOther) {
      const lastStudent = await knex("students")
        .where("students.isOther", 1)
        .andWhere("students.idCenter", data.idCenter)
        .count("*", { as: "total" })
        .then((result) => {
          return result[0].total;
        });

      registerNumber = `R${lastStudent + 1}`;
    } else {
      const lastStudent = await knex("students")
        .where("students.isOther", 0)
        .andWhere("students.idCenter", data.idCenter)
        .count("*", { as: "total" })
        .then((result) => {
          return result[0].total;
        });

      registerNumber = lastStudent + 1;
    }

    // Guardo el estudiante en la tabla estudiantes
    const studentID = await knex("students")
      .insert({
        registerNumber: registerNumber,
        dni: data.dni.toUpperCase(),
        dniExpiration: data.dniExpiration,
        firstName: data.firstName.toUpperCase(),
        lastName1: data.lastName1.toUpperCase(),
        lastName2: data.lastName2.toUpperCase(),
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        wayType: data.wayType.toUpperCase(),
        wayName: data.wayName.toUpperCase(),
        wayNumber: data.wayNumber,
        block: data.block.toUpperCase(),
        floor: data.floor.toUpperCase(),
        door: data.door.toUpperCase(),
        postalCode: data.postalCode,
        city: data.city.toUpperCase(),
        province: data.province.toUpperCase(),
        nationality: data.nationality.toUpperCase(),
        countryBirth: data.countryBirth.toUpperCase(),
        birthday: data.birthday,
        how: data.how,
        recieveNotifications: data.recieveNotifications ? 1 : 0,
        idCenter: data.idCenter,
        // active: data.active ? 1 : 0,
        // Lo parcheo de momento
        active: 1,
        firstContact: data.firstContact,
        password: data.dni,
        completeCourse: data.completeCourse ? 1 : 0,
        observations: data.observations,
        isOther: data.isOther,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .then(([ID]) => {
        console.log(ID, "id del nuevo estudiantes");
        return ID;
      })
      .catch((error) => {
        console.log(error, "error");
        console.log("no lo ha guardado por fallo del student");
      });

    // Guardo el estudiante en la tabla users
    const userID = await knex("users")
      .insert({
        user: code,
        password: newPassword,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .then(([ID]) => {
        console.log(ID, "id del nuevo user");
        return ID;
      })
      .catch((err) => console.log(err, "error al crear user"));

    // Guardo el estudiante en la tabla roles
    const userRols = await knex("user_rols")
      .insert({
        idUser: userID, // id de Usuario en user table
        idEntity: studentID, // id de student en Student table
        role: "ROLE_STUDENT",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .then(([ID]) => {
        console.log(ID, "id del nuevo user-rol");
        return ID;
      })
      .catch((err) => console.log(err, "error al crear user rol"));

    // Creo una bolsa de clases para el estudiante
    const classBag = await knex("student_class_bags")
      .insert({
        idStudent: studentID, // id de Estudiante
        quantity: 0, // numero de clases
        created_at: new Date(),
        updated_at: new Date(),
      })
      .then(([ID]) => {
        console.log(ID, "id de la nueva bolsa de clases");
        return ID;
      })
      .catch((err) => console.log(err, "error al crear bolsa de clases"));

    // Guardo un nuevo curso
    // Hacer logica para fechas
    const course = await knex("courses")
      .insert({
        idStudent: studentID, // id de Estudiante
        signUp: data.signUp, // fecha matricula
        startDate: data.startDate, // fecha empieza
        signUp: data.signUp,
        permission: data.permission,
        idTariff: data.tariff,
        practiceSent: 0, // numero de clases
        // end Date (+ 8 o 9 dias de signUp)
        endDate: new Date(),
        felicitationBirthday: new Date(),
        twoMonths: new Date(),
        endDateBad: new Date(), // numero de clases
        created_at: new Date(),
        updated_at: new Date(),
      })
      .then(([ID]) => {
        console.log(ID, "id del curso");
        return ID;
      })
      .catch((err) => console.log(err, "error al crear curso"));

    // Busco la tarifa para insertar datos en pagos
    const tariff = await knex("tariffs")
      .select("tariffs.pvpSignUp", "tariffs.pvpCourse")
      .where("tariffs.id", data.tariff)
      .first()
      .then((result) => {
        return result;
      })
      .catch((err) => {
        return "No se encuentra";
      });

    // Crear e insertar nuevos pagos
    const payments = [];

    const payment1 = {
      idStudent: studentID,
      description: "Matrícula",
      quantity: tariff.pvpSignUp,
      type: "Cargo",
      date: new Date(),
      paymentType: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    payments.push(payment1);

    if (data.completeCourse) {
      const payment2 = {
        idStudent: studentID,
        description: "Curso Teórico",
        quantity: tariff.pvpCourse,
        type: "Cargo",
        date: new Date(),
        paymentType: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      payments.push(payment2);
    }

    await knex("payments")
      .insert(payments)
      .then((result) => console.log("se guardan los pagos"))
      .catch((result) => console.log("NO se guardan los pagos"));

    // Cuando las anteriores se han creado, meter el id del usuario en idUser, y el id del student(tabla students) en idEntity
    return res.json("Se ha creado correctamente");
  }
);

// EDIT
router.post(
  "/:studentID",
  [
    param("studentID").isInt().toInt(),
    body("idCenter").toInt(),
    body("registerNumber"),
    body("dni"),
    body("dniExpiration").toDate(),
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
    body("medicalExamination"),
    body("countryBirth"),
    body("birthday").toDate(),
    body("how"),
    body("firstContact"),
    body("recieveNotifications"),
    body("permission"),
    body("tariff"),
    body("completeCourse"),
    body("observations"),
    body("active"),
    body("isOther"),
    body("signUp").toDate(),
    body("startDate").toDate(),
    body("endDate").toDate(),
    body("user"),
    body("password"),
    body("classes").toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    const studentID = data.studentID;
    console.log(data, "data para guardar");

    // Crear codigo para la tabla user

    let newPassword = null;

    // Creo contrasena para la tabla users
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

    // Guardo el estudiante en la tabla estudiantes
    const studentQuery = await knex("students")
      .update({
        registerNumber: data.registerNumber,
        dni: data.dni.toUpperCase(),
        dniExpiration: data.dniExpiration,
        firstName: data.firstName.toUpperCase(),
        lastName1: data.lastName1.toUpperCase(),
        lastName2: data.lastName2.toUpperCase(),
        email: data.email,
        phone: data.phone,
        gender: data.gender,
        wayType: data.wayType.toUpperCase(),
        wayName: data.wayName.toUpperCase(),
        wayNumber: data.wayNumber.toUpperCase(),
        block: data.block.toUpperCase(),
        floor: data.floor.toUpperCase(),
        door: data.door.toUpperCase(),
        postalCode: data.postalCode,
        city: data.city.toUpperCase(),
        province: data.province.toUpperCase(),
        nationality: data.nationality.toUpperCase(),
        medicalExamination: data.medicalExamination,
        countryBirth: data.countryBirth.toUpperCase(),
        birthday: data.birthday,
        how: data.how,
        recieveNotifications: data.recieveNotifications ? 1 : 0,
        idCenter: data.idCenter,
        active: data.active ? 1 : 0,
        firstContact: data.firstContact,
        password: data.password,
        completeCourse: data.completeCourse ? 1 : 0,
        observations: data.observations,
        isOther: data.isOther,
        updated_at: new Date(),
      })
      .where("students.id", studentID)
      .then((ID) => {
        console.log(ID, "id del estudiantes");
        return ID;
      })
      .catch((error) => {
        console.log(error, "error");
        console.log("no lo ha guardado por fallo del student");
      });

    // Busco ID del usuario para manipular la tabla users
    const userID = await knex("user_rols")
      .select("user_rols.idUser")
      .where("user_rols.idEntity", studentID)
      .andWhere("user_rols.role", "ROLE_STUDENT")
      .first()
      .then(({ idUser }) => {
        console.log(idUser, "id del nuevo user-rol");
        return idUser;
      })
      .catch((err) => console.log(err, "error al crear user rol"));

    // Guardo el estudiante en la tabla users
    const userUpdated = await knex("users")
      .update({
        user: data.user,
        password: newPassword,
        updated_at: new Date(),
      })
      .where("users.id", userID)
      .then((ID) => {
        console.log(ID, "id del nuevo user");
        return ID;
      })
      .catch((err) => console.log(err, "error al crear user"));

    // Creo una bolsa de clases para el estudiante
    const classBag = await knex("student_class_bags")
      .update({
        quantity: data.classes ? data.classes : 0, // numero de clases
        updated_at: new Date(),
      })
      .where("student_class_bags.idStudent", studentID)
      .then((ID) => {
        console.log(ID, "id de la nueva bolsa de clases");
        return ID;
      })
      .catch((err) => console.log(err, "error al crear bolsa de clases"));

    // Guardo un nuevo curso
    // Hacer logica para fechas
    const course = await knex("courses")
      .update({
        signUp: data.signUp, // fecha matricula
        startDate: data.startDate, // fecha empieza
        signUp: data.signUp,
        permission: data.permission,
        idTariff: data.tariff,
        practiceSent: 0, // numero de clases
        // end Date (+ 8 o 9 dias de signUp)
        endDate: new Date(),
        felicitationBirthday: new Date(),
        twoMonths: new Date(),
        endDateBad: new Date(), // numero de clases
        updated_at: new Date(),
      })
      .where("courses.idStudent", studentID)
      .then((ID) => {
        console.log(ID, "id del curso");
        return ID;
      })
      .catch((err) => console.log(err, "error al crear curso"));

    // Cuando las anteriores se han creado, meter el id del usuario en idUser, y el id del student(tabla students) en idEntity
    return res.json("Se ha creado correctamente");
  }
);

module.exports = router;
