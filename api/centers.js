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
  "/get-closures",
  [
    query("centerID").optional(),
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
      centerID = null,
      orderBy = null,
      orderDir = null,
      perPage = 10,
      page = 1,
    } = req.query;

    let getQuery = knex
      .table("closures")
      .where("closures.idCenter", centerID)
      .orderBy("closures.date", "desc");

    var totalCount = await getQuery
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQuery
      .limit(perPage)
      .offset((page - 1) * perPage)
      .select(
        "closures.id",
        "closures.created_at",
        "closures.updated_at",
        "closures.date",
        "closures.description",
        "closures.idCenter",
        "closures.quantity"
      );

    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);

router.post(
  "/closure",
  [
    body("centerID").toInt(),
    body("description"),
    body("date"),
    body("quantity"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("closures")
      .insert({
        description: data.description,
        date: new Date(),
        quantity: data.quantity,
        idCenter: data.centerID,
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
    .select(
      "date",
      "firstName",
      "lastName1",
      "paymentType",
      "quantity",
      "type",
      "description"
    );

  return res.json({
    page: page || 1,
    perPage: perPage || 10,
    totalCount: totalCount[0].totalResults,
    results: results,
  });
};

const exportPayments = async (res, getQueryPayments) => {
  // var student = await knex("students")
  //   .select("students.firstName as Nombre", "students.lastName1 as Apellido")
  //   .where("students.id", studentID);

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
    data: formatResult,
  });
};

router.get(
  "/get-payments",
  [
    query("centerID").optional(),
    query("view").optional(),
    query("search").optional(),
    query("startDate").optional(),
    query("endDate").optional(),
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
      view = "listing",
      centerID = null,
      startDate = null,
      endDate = null,
      orderBy = null,
      perPage = 10,
      page = 1,
    } = req.query;

    let getQueryPayments = knex
      .table("payments")
      .leftJoin("students", "students.id", "payments.idStudent")
      .where("students.idCenter", centerID)
      .orderBy("payments.date", "desc");

    if (null !== startDate) {
      getQueryPayments.where("payments.date", ">=", new Date(startDate));
    }
    if (null !== endDate) {
      getQueryPayments.where("payments.date", "<=", new Date(endDate));
    }

    switch (view) {
      case "listing":
        return listingPayments(res, getQueryPayments, perPage, page, orderBy);

      case "export":
        return exportPayments(res, getQueryPayments, centerID);

      default:
        return res.status(404).send("View not found");
    }
  }
);

router.get(
  "/:centerID",
  [param("centerID").isInt().toInt()],
  async (req, res) => {
    try {
      const { centerID } = matchedData(req);

      const centerQuery = await knex("centers")
        .select(
          "centers.id",
          "centers.adress",
          "centers.cif",
          "centers.city",
          "centers.controlDigit",
          "centers.denomination",
          "centers.master",
          "centers.masterDNI",
          "centers.maxPrice",
          "centers.minPrice",
          "centers.name",
          "centers.postalCode",
          "centers.provinceNumber",
          "centers.sectionNumber",
          "rol.role",
          "users.user"
        )
        .where("centers.id", centerID)
        .first()
        // SELECCIONAR ROL?
        .leftJoin("user_rols as rol", "centers.id", "rol.idEntity")
        .where("centers.id", centerID)
        .andWhere("rol.role", "ROLE_CENTER")
        .leftJoin("users", "users.id", "rol.idEntity")
        .where("idEntity", centerID)
        .then((result) => {
          return result;
        });

      console.log(centerQuery, "query del centro");

      const studentsActive = await knex("students")
        .where("students.idCenter", centerQuery.id)
        .andWhere("students.active", 1)
        .andWhere("students.isOther", 0)
        .count("* as actives")
        .then(([{ actives }]) => {
          return actives;
        });

      const otherActive = await knex("students")
        .where("students.idCenter", centerQuery.id)
        .andWhere("students.active", 1)
        .andWhere("students.isOther", 1)
        .count("* as otherActives")
        .then(([{ otherActives }]) => {
          return otherActives;
        });

      return res.json({
        results: centerQuery,
        actives: studentsActive,
        otherActives: otherActive,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send("Error");
    }
  }
);

router.get(
  "/",
  // defaultGetValidators,
  (req, res) => {
    const query = knex("centers")
      .select(
        "centers.id",
        "centers.adress",
        "centers.cif",
        "centers.city",
        "centers.controlDigit",
        "centers.denomination",
        "centers.master",
        "centers.masterDNI",
        "centers.maxPrice",
        "centers.minPrice",
        "centers.name",
        "centers.postalCode",
        "centers.provinceNumber",
        "centers.sectionNumber",
        "centers.created_at",
        "centers.updated_at"
        // "centers.numberOthers",
        // "centers.numberStudents"
      )
      .then((results) => {
        return res.json({
          results,
        });
      })
      .catch((error) => res.status(500).send(JSON.stringify(error)));
  }
);

// CREAR CENTER
router.post(
  "/",
  [
    body("name"),
    body("email"),
    body("minPrice"),
    body("maxPrice"),
    body("denomination"),
    body("adress"),
    body("postalCode"),
    body("city"),
    body("master"),
    body("masterDNI"),
    body("cif"),
    body("provinceNumber"),
    body("sectionNumber"),
    body("controlDigit"),
    body("password"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

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

    var centerQuery = new Promise((resolve) => {
      knex("centers")
        .insert({
          name: data.name,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          denomination: data.denomination,
          adress: data.adress,
          postalCode: data.postalCode,
          city: data.city,
          master: data.master,
          masterDNI: data.masterDNI,
          cif: data.cif,
          provinceNumber: data.provinceNumber,
          sectionNumber: data.sectionNumber,
          controlDigit: data.controlDigit,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .then((centerID) => {
          resolve(centerID);
        })
        .catch((error) => {
          console.log("no lo ha guardado por fallo del center");
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

    return Promise.all([centerQuery, userQuery])
      .then((results) => {
        console.log(results, "resultados finales");

        knex("user_rols")
          .insert({
            idUser: results[1], // falta conseguir este dato
            idEntity: results[0], // falta conseguir este dato
            role: "ROLE_CENTER",
            created_at: new Date(),
            updated_at: new Date(),
          })
          .then((response) => {
            return res.json({
              results: response,
            });
          });
      })
      .catch((err) => console.log("error"));
  }
);

// EDIT
router.post(
  "/:ID",
  [
    param("ID").isInt().toInt(),
    body("name"),
    body("email"),
    body("minPrice"),
    body("maxPrice"),
    body("denomination"),
    body("adress"),
    body("postalCode"),
    body("city"),
    body("master"),
    body("masterDNI"),
    body("cif"),
    body("provinceNumber"),
    body("sectionNumber"),
    body("controlDigit"),
    body("password"),
    body("identityID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    // ID = id del center en la tabla centers
    // identityID = id que tiene el center en la tabla user
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

    var centerQuery = new Promise((resolve) => {
      knex("centers")
        .update({
          name: data.name,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          denomination: data.denomination,
          adress: data.adress,
          postalCode: data.postalCode,
          city: data.city,
          master: data.master,
          masterDNI: data.masterDNI,
          cif: data.cif,
          provinceNumber: data.provinceNumber,
          sectionNumber: data.sectionNumber,
          controlDigit: data.controlDigit,
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
          password: newPassword,
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

    return Promise.all([centerQuery, userQuery]).then((results) => {
      console.log(results, "resultados finales");
      return res.json({
        results: results,
      });
    });
  }
);

module.exports = router;
