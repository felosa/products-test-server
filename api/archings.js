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

const listingArchings = async (
  res,
  getQuery,
  perPage,
  page,
  orderBy,
  orderDir
) => {
  var totalCount = await getQuery
    .clone()
    .count("*", { as: "totalResults" })
    .limit(999999)
    .offset(0);

  var results = await getQuery
    .limit(perPage)
    .offset((page - 1) * perPage)
    .select(
      "archings.id",
      "archings.date",
      "archings.tpv",
      "archings.cash",
      "archings.wireTransfer",
      "archings.online",
      "archings.withdrawals",
      "archings.total",
      "archings.idCenter"
    );

  return res.json({
    page: page || 1,
    perPage: perPage || 10,
    totalCount: totalCount[0].totalResults,
    results: results,
  });
};

const exportArchings = async (res, getQuery, centerID) => {
  var center = await knex("centers")
    .select("centers.name as Nombre")
    .where("centers.id", centerID);

  var results = await getQuery.select(
    "archings.date as Fecha",
    "archings.tpv as TPV Manual",
    "archings.online as TPV Online",
    "archings.wireTransfer as Transferencia",
    "archings.cash as Efectivo",
    "archings.withdrawals as Retiradas",
    "archings.total as Total"
  );

  const formatResult = results.map((elem) => {
    elem["Fecha"] = moment(elem["Fecha"]).format("DD/MM/YYYY HH:mm:ss");
    return elem;
  });

  return res.json({
    centerName: `${center[0]["Nombre"]}`,
    data: formatResult,
  });
};

// GET ALL ARQUEOS
router.get(
  "/",
  [
    query("view").optional(),
    query("centerID").optional(),
    query("startDate").optional(),
    query("endDate").optional(),
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
      view = "listing",
      centerID = null,
      startDate = null,
      endDate = null,
      perPage = 10,
      page = 1,
    } = req.query;

    var getQuery = knex
      .table("archings")
      .orderBy("archings.created_at", "desc");

    if (centerID) {
      getQuery.where("archings.idCenter", centerID);
    }

    if (null !== startDate) {
      getQuery.where("archings.date", ">=", new Date(startDate));
    }
    if (null !== endDate) {
      getQuery.where("archings.date", "<=", new Date(endDate));
    }

    switch (view) {
      case "listing":
        return listingArchings(res, getQuery, perPage, page);

      case "export":
        return exportArchings(res, getQuery, centerID);

      default:
        return res.status(404).send("View not found");
    }
  }
);

// CREAR ARQUEO HACER DE 0
router.post("/", [body("centerID").toInt()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const data = matchedData(req, { includeOptionals: true });

  console.log(data, "centro llega");

  // necesito el ultimo arqueo para saber apartir de que fecha y total hay que hacer el siguiente
  const lastArching = await knex("archings")
    .select("archings.date as lastArchingDate", "archings.total")
    .where("archings.idCenter", data.centerID)
    .orderBy("archings.date", "desc")
    .first();

  // si no hay ningun arching previo, cojo la fecha de creacion del centro y total es 0
  const centerInfo = await knex("centers")
    .select("centers.created_at")
    .where("centers.id", data.centerID)
    .first();

  console.log(centerInfo, "centerInfo");

  const lastArchingDate = lastArching
    ? lastArching.lastArchingDate
    : centerInfo.created_at;

  const lastArchingTotal = lastArching ? lastArching.total : 0;

  const payments = await knex("payments")
    .leftJoin("students", "payments.idStudent", "students.id")
    .select("payments.paymentType", "payments.quantity")
    .where("students.idCenter", data.centerID)
    .andWhere("payments.type", "Pago")
    .andWhere("payments.date", ">", lastArchingDate);

  const closures = await knex("closures")
    .select("closures.quantity")
    .where("closures.date", ">", lastArchingDate);

  const withdrawals = closures.reduce((total, elem) => {
    return elem.quantity + total;
  }, 0);

  const paymentsSum = payments.reduce(
    (finalObject, elem) => {
      const newValue = elem.quantity + finalObject[elem.paymentType];
      finalObject[elem.paymentType] = newValue;
      return finalObject;
    },
    {
      "TPV Manual": 0,
      "TPV Online": 0,
      Transferencia: 0,
      Efectivo: 0,
      "SUPERVISOR (Si es pack recuerda además reducir nº clases bolsa)": 0,
    }
  );
  console.log(lastArchingTotal, paymentsSum["Efectivo"], withdrawals, "dinero");
  knex("archings")
    .insert({
      date: new Date(),
      tpv: paymentsSum["TPV Manual"],
      cash: paymentsSum["Efectivo"],
      wireTransfer: paymentsSum["Transferencia"],
      online: paymentsSum["TPV Online"],
      withdrawals: withdrawals,
      total: lastArchingTotal + paymentsSum["Efectivo"] - withdrawals,
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
});

module.exports = router;
