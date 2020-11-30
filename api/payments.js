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
const RedSys = require("redsys-pos");
const { CURRENCIES, TRANSACTION_TYPES } = RedSys;

const router = express.Router();

// //SAN MIGUEL
// REDSYS_MERCHANT_CODE_2 = 337131965;
// REDSYS_MERCHANT_CODE_SHA256_2 = "qwYpJ9faZX7HjaFt70kF3qHl/z+laldV";
// ACTUR
REDSYS_MERCHANT_CODE_3 = 350030235;
REDSYS_MERCHANT_CODE_SHA256_3 = "+GzPjLrcqJzaZwmeZeisbcG8qmUtH/Jh";
// FRAGA
REDSYS_MERCHANT_CODE_4 = 346668601;
REDSYS_MERCHANT_CODE_SHA256_4 = "LCvveWrN4Tz/7jKPP3FQ67OPxhGcQVy7";
// MONZÓN
REDSYS_MERCHANT_CODE_5 = 086467271;
REDSYS_MERCHANT_CODE_SHA256_5 = "o4yCJDVGhhY6rUq5w96lr31OjOLW5f9/";
// BARBASTRO
REDSYS_MERCHANT_CODE_6 = 086467271;
REDSYS_MERCHANT_CODE_SHA256_6 = "o4yCJDVGhhY6rUq5w96lr31OjOLW5f9/";
// ARGÜELLES
REDSYS_MERCHANT_CODE_7 = 337578546;
REDSYS_MERCHANT_CODE_SHA256_7 = "Sa3oOhGhAYt4oxlNYDi1hs2CuS1c1+ME";
// PRUEBAS
REDSYS_MERCHANT_CODE_8 = 337131965;
REDSYS_MERCHANT_CODE_SHA256_8 = "qwYpJ9faZX7HjaFt70kF3qHl/z+laldV";

// const createPayment = (res) => {
//   // const commerce_code = "<your_commerce_code>";
//   // const secret_code = "<your_secret_key>";
//   const packId = 1;
//   const studentId = 1;
//   const centerId = 2;
//   const amount = 2000;
//   // const claveSHA256 = REDSYS_MERCHANT_CODE_SHA256_8;
//   const domain = `https://gestion.autius.com/api/getRedsysPacksResponse?packId=${packId}&studentId=${studentId}&centerId=${centerId}`;

//   const commerce_code = process.env.COMMERCE_CODE || "000000000";
//   const secret_code =
//     process.env.COMMERCE_SECRET || "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

//   const redsys = new RedsysBuilder()
//     .setMerchantCode(REDSYS_MERCHANT_CODE_2)
//     .setName("")
//     .setTitular("")
//     .setSecret(REDSYS_MERCHANT_CODE_SHA256_2)
//     .enablePayByReference()
//     .enableDebug()
//     .build();

//   console.log(redsys, "redsys");

//   const payment = new PaymentBuilder()
//     .setTotal(amount)
//     .setOrderId(+Date.now())
//     .setUrlMerchant('')
//     .setUrlCancel(domain)
//     .setUrlOK(domain)
//     .build();

//   console.log(payment, "pago");

//   const form_encoded_params = redsys.getFormData(payment);

//   return res.json({ result: form_encoded_params });
// };

//Snippet to obtain the signature & merchantParameters
function createPayment(description, total, titular, orderId, paymentId) {
  const classId = 1;
  const studentId = 1;
  const centerId = 2;
  const amount = 20;
  //SAN MIGUEL
  REDSYS_MERCHANT_CODE_2 = 337131965;
  REDSYS_MERCHANT_CODE_SHA256_2 = "qwYpJ9faZX7HjaFt70kF3qHl/z+laldV";

  const domain = `https://localhost?classId=${classId}&studentId=${studentId}&centerId=${centerId}&amount=${amount}`;

  const MERCHANT_KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7"; // TESTING KEY
  const redsys = new RedSys(REDSYS_MERCHANT_CODE_SHA256_2);

  const order = +new Date();
  const orderString = order.toString();

  var obj = {
    amount: "100", // cents (in euro)
    orderReference: orderString,
    merchantName: "Autius",
    merchantCode: REDSYS_MERCHANT_CODE_2,
    currency: CURRENCIES.EUR,
    transactionType: TRANSACTION_TYPES.AUTHORIZATION, // '0'
    terminal: "1",
    merchantURL: "",
    successURL: domain,
    errorURL: domain,
  };

  const result = redsys.makePaymentParameters(obj);
  return result;
}
// function createPayment(description, total, titular, orderId, paymentId) {
//   const classId = 12;
//   const studentId = 1;
//   const centerId = 2;
//   const amount = 20;
//   const claveSHA256 = REDSYS_MERCHANT_CODE_SHA256_2;

//   const domain = `https://gestion.autius/api/getRedsysClassResponse?classId=${classId}&studentId=${studentId}&centerId=${centerId}&amount=${amount}`;

//   const redsys = new Redsys();
//   const mParams = {
//     DS_MERCHANT_AMOUNT: '145',
//     DS_MERCHANT_ORDER: +new Date(),
//     DS_MERCHANT_MERCHANTCODE: 999008881,
//     DS_MERCHANT_CURRENCY: 978,
//     DS_MERCHANT_TRANSACTIONTYPE: 0,
//     DS_MERCHANT_TERMINAL: 001,
//     DS_MERCHANT_MERCHANTURL: "",
//     DS_MERCHANT_URLOK: domain,
//     DS_MERCHANT_URLKO: domain,
//   };
//   console.log(mParams.DS_MERCHANT_ORDER);
//   // return res.json({ result: form_encoded_params });
//   return {
//     signature: redsys.createMerchantSignature(claveSHA256, mParams),
//     merchantParameters: redsys.createMerchantParameters(mParams),
//     raw: mParams,
//   };
// }

// //Snippet to process the TPV callback
// const merchantParams =
//   tpvResponse.Ds_MerchantParameters || tpvResponse.DS_MERCHANTPARAMETERS;
// const signature = tpvResponse.Ds_Signature || tpvResponse.DS_SIGNATURE;

// const merchantParamsDecoded = redsys.decodeMerchantParameters(merchantParams);
// const merchantSignatureNotif = redsys.createMerchantSignatureNotif(
//   tpvInfo.secret,
//   merchantParams
// );
// const dsResponse = parseInt(
//   merchantParamsDecoded.Ds_Response || merchantParamsDecoded.DS_RESPONSE
// );

// if (
//   redsys.merchantSignatureIsValid(signature, merchantSignatureNotif) &&
//   dsResponse > -1 &&
//   dsResponse < 100
// ) {
//   console.log("TPV payment is OK");
// } else {
//   console.log("TPV payment KO");
// }

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

    const datos = createPayment();

    console.log(datos, "datos");

    return res.json({ result: datos });
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
