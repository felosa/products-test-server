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

const router = express.Router();

router.get(
  "/",
  // defaultGetValidators,
  (req, res) => {
      // HABRA QUE ANADIR FILTROS PARA FILTRAR POR CENTRO O SACAR TODOS
    const query = knex("teachers")
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
        "centers.updated_at",
        // "centers.numberOthers",
        // "centers.numberStudents"
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

// CREAR CENTER
router.post(
  "/",
  [
    body("name"),
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
  (req, res) => {
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

      bcrypt.hash(data.password, salt).then((hash, err) => {
        if (err) {
          this.logger.logError(err, "registerUser");

          reject(err);
        }

        knex("centers").insert({
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
        });
        knex("users").insert({
          user: data.user,
          minPrice: data.hash,
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Cuando las anteriores se han creado, meter el id del usuario en idUser, y el id del centro en idEntity
        knex("user_rols").insert({
          idUser: "idUser", // falta conseguir este dato
          idEntity: "idCenter", // falta conseguir este dato
          role: "ROLE_CENTER",
          created_at: new Date(),
          updated_at: new Date(),
        });
        // .then(([newID]) => {
        //   return res.json({ newID });
        // })
        // .catch((err) => {
        //   return res.status(500).send(err);
        // });
      });
    });
  }
);



// EDIT
router.post(
    "/:ID",
    [
      param("ID")
        .isInt()
        .toInt(),
        body("name"),
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
        .then(result => {
          if (result > 0) {
            return res.send("Updated");
          }
          return res.status(404).send("Not found");
        })
        .catch(err => {
          return res.status(500).send(err);
        });
    }
  );
  
  // DELETE
  router.delete(
    "/:ID",
    [
      param("ID")
        .isInt()
        .toInt()
    ],
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
  
      const { ID } = matchedData(req, { includeOptionals: true });
  
      knex("centers")
        .where({
          id: ID
        })
        .del()
        .then(value => {
          if (value > 0) {
            return res.send("OK");
          }
          return res.status(404).send("Not found");
        })
        .catch(error => {
          return res.status(500).send(error);
        });
    }
  );

module.exports = router;
