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

// GET ALL ARQUEOS
router.get(
  "/",
  [
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
      centerID = null,
      startDate = null,
      endDate = null,
      perPage = 10,
      page = 1,
    } = req.query;

    console.log(endDate, "endDate");
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

  const payments = await knex("payments")
    .leftJoin("students", "payments.idStudent", "students.id")
    .select("payments.paymentType", "payments.quantity")
    .where("students.idCenter", data.centerID)
    .andWhere("payments.type", "Pago");
  // .andWhere("payments.date", ">", "fecha de ultimo arqueo")

  const closures = await knex("closures").select("closures.quantity");
  // .where("closures.date", ">", "fecha ultimo arqueo");

  const withdrawals = closures.reduce((total, elem) => {
    return elem.quantity + total;
  }, 0);

  console.log(withdrawals, "total withdrawals");

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

  console.log(paymentsSum, "suma de todo");

  knex("archings")
    .insert({
      // date: new Date(),
      tpv: paymentsSum["TPV Manual"],
      cash: paymentsSum["Efectivo"],
      wireTransfer: paymentsSum["Transferencia"],
      online: paymentsSum["TPV Online"],
      withdrawals: withdrawals,
      // total: 0 + paymentsSum["Efectivo"] - withdrawals,
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
