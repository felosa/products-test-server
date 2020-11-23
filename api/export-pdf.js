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

const autorizacionPDF = (res) => {
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
};

const contratoPDF = (res) => {
  var originalHtml = fs.readFileSync("templates/contrato.html", "utf8");
  var options = { format: "A4" };

  var html = originalHtml
    .replace(
      "{{ logoAuto }}",
      `file://${require.resolve("../images/logoAuto.png")}`
    )
    .replace(
      "{{ firmaDirector }}",
      `file://${require.resolve("../images/firmaDirector.png")}`
    );
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
};

const solicitudPDF = (res) => {
  var originalHtml = fs.readFileSync("templates/solicitudExamen.html", "utf8");
  var options = { format: "A4" };
  var html = originalHtml
    .replace(
      "{{ geLogo }}",
      `file://${require.resolve("../images/geLogo.png")}`
    )
    .replace("{{ dgtLogo }}", `file://${require.resolve("../images/dgt.png")}`);

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
};

const trasladoPDF = (res) => {
  var originalHtml = fs.readFileSync(
    "templates/trasladoExpediente.html",
    "utf8"
  );
  var options = { format: "A4" };

  var html = originalHtml
    .replace(
      "{{ geLogo }}",
      `file://${require.resolve("../images/geLogo.png")}`
    )
    .replace("{{ dgtLogo }}", `file://${require.resolve("../images/dgt.png")}`);

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
};

const teoricaPDF = (res) => {
  var html = fs.readFileSync("templates/fichaTeorica.html", "utf8");
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
};

const practicaPDF = (res) => {
  var originalHtml = fs.readFileSync("templates/fichaPractica.html", "utf8");
  var options = { format: "A4" };

  var html = originalHtml
    .replace(
      "{{ geLogo }}",
      `file://${require.resolve("../images/geLogo.png")}`
    )
    .replace("{{ dgtLogo }}", `file://${require.resolve("../images/dgt.png")}`)
    .replace(
      "{{ firmaDirector }}",
      `file://${require.resolve("../images/firmaDirector.png")}`
    );

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
};

const reciboPDF = (res) => {
  var html = fs.readFileSync("templates/recibo.html", "utf8");
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
};

// GET PARAR LOS PDF
router.get(
  "/",
  [
    query("type").optional(),
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      type = "listing",
      //   centerID = null,
      //   startDate = null,
      //   endDate = null,
      //   orderBy = null,
      //   orderDir = null,
      //   perPage = 10,
      //   page = 1,
    } = req.query;

    console.log(type, "tipo");

    switch (type) {
      case "autorizacion":
        return autorizacionPDF(res);
      case "contrato":
        return contratoPDF(res);
      case "solicitud":
        return solicitudPDF(res);
      case "traslado":
        return trasladoPDF(res);
      case "teorica":
        return teoricaPDF(res);
      case "practica":
        return practicaPDF(res);
      case "recibo":
        return reciboPDF(res);

      default:
        return res.status(404).send("View not found");
    }
  }
);

module.exports = router;
