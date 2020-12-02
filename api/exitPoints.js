const express = require("express");
const {
  query,
  validationResult,
  matchedData,
  param,
  body,
} = require("express-validator");
const knex = require("../db/knex"); //the connection

const router = express.Router();

// TODOS LOS PUNTOS
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
      .table("exit_points")
      .orderBy("exit_points.created_at", "desc");
    if (centerID) {
      getQuery.where("exit_points.idCenter", centerID);
    }

    var totalCount = await getQuery
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQuery
      .limit(perPage)
      .offset((page - 1) * perPage)
      .leftJoin("centers", "centers.id", "exit_points.idCenter")
      .select(
        "exit_points.id",
        "exit_points.name",
        "exit_points.position",
        "exit_points.idCenter",
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

// GET ONE VEHICLE
router.get(
  "/:exitPointID",
  [param("exitPointID").isInt().toInt()],
  async (req, res) => {
    try {
      const { exitPointID } = matchedData(req);
      var exitQuery = knex("exit_points")
        .leftJoin("centers", "centers.id", "exit_points.idCenter")
        .select(
          "exit_points.id",
          "exit_points.name",
          "exit_points.position",
          "exit_points.idCenter",
          "centers.name as centerName"
        )
        .where("exit_points.id", exitPointID)
        .first()
        .then((result) => {
          return res.json(result);
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

// CREAR VEHICLE
router.post(
  "/",
  [body("position"), body("name"), body("idCenter")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });
    console.log(data, "coordenadas");
    knex("exit_points")
      .insert({
        name: data.name,
        position: data.position,
        idCenter: data.idCenter,
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

// EDIT VEHICLE
router.post(
  "/:ID",
  [
    param("ID").isInt().toInt(),
    body("name"),
    body("position"),
    body("idCenter"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const data = matchedData(req, { includeOptionals: true });

    knex("exit_points")
      .update({
        name: data.name,
        position: data.position,
        idCenter: data.idCenter,
        updated_at: new Date(),
      })
      .where("id", data.ID)
      .then((result) => {
        if (result > 0) {
          return res.send(`Updated`);
        }
        return res.status(404).send("Not found");
      })
      .catch((err) => {
        return res.status(500).send(err);
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

  knex("exit_points")
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
