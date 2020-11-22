const express = require("express");
var fs = require("fs");
var pdf = require("html-pdf");
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

// TODOS LOS EXAMENES DE UN CENTRO
router.get(
  "/",
  [
    // query("centerID").optional(),
    // query("search").optional(),
    // query("orderBy").optional({ nullable: true }),
    // query("orderDir").isIn(["asc", "desc"]).optional({ nullable: true }),
    // query("perPage").isInt({ min: 1, max: 100 }).toInt().optional(),
    // query("page").isInt({ min: 1 }).toInt().optional(),
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
    console.log("hola");
    var html = fs.readFileSync("templates/autorizacion.html", "utf8");
    var options = { format: "A4" };

    pdf.create(html, options).toStream(function (err, stream) {
      if (err) {
        //error handling
      }
      res.writeHead(200, {
        "Content-Type": "application/force-download",
        "Content-disposition": "attachment; filename=file.pdf",
      });
      stream.pipe(res);
    });
  }
);

module.exports = router;
