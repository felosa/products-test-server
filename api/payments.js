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
const { getResponseCodeMessage } = require("redsys-pos");
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

//Snippet to obtain the signature & merchantParameters
function createPayment(description, total, titular, orderId, paymentId) {
  const classId = 1;
  const studentId = 1;
  const centerId = 2;
  const amount = 20;
  //SAN MIGUEL
  REDSYS_MERCHANT_CODE_2 = "337131965";
  REDSYS_MERCHANT_CODE_SHA256_2 = "qwYpJ9faZX7HjaFt70kF3qHl/z+laldV";

  const domain = `http://localhost:8000/api/payments?classId=${classId}&studentId=${studentId}&centerId=${centerId}&amount=${amount}`;

  const MERCHANT_KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7"; // TESTING KEY
  const redsys = new RedSys(MERCHANT_KEY);

  const order = +new Date();
  const orderString = order.toString();
  console.log(orderString, "order");

  var obj = {
    amount: "100", // cents (in euro)
    orderReference: "1606718241", // 10 cifras
    merchantName: "Autius",
    merchantCode: "327234688",
    currency: CURRENCIES.EUR,
    transactionType: TRANSACTION_TYPES.AUTHORIZATION, // '0'
    terminal: "1",
    merchantURL: "http://gestion.autius.com/",
    successURL: "http://beta2020.autius.com?state=succes",
    errorURL: "http://beta2020.autius.com?state=error",
  };

  const result = redsys.makePaymentParameters(obj);
  return result;
}

function decodeResponse(merchantParams, signature) {
  const MERCHANT_KEY = "sq7HjrUOBfKmC576ILgskD5srU870gJ7"; // TESTING KEY
  const redsys = new RedSys(MERCHANT_KEY);
  //   const merchantParams = "eyJEc19EYXRlIjoiMjAlMkYxMCUyRjIwMTciLCJEc19Ib3VyIjoiMTclM0EyMyIsIkRzX1NlY3VyZVBheW1lbnQiOiIwIiwiRHNfQW1vdW50IjoiMTAwIiwiRHNfQ3VycmVuY3kiOiI5NzgiLCJEc19PcmRlciI6IjAwMDA5NjU1RDg0IiwiRHNfTWVyY2hhbnRDb2RlIjoiMzI3MjM0Njg4IiwiRHNfVGVybWluYWwiOiIwMDEiLCJEc19SZXNwb25zZSI6Ijk5MTUiLCJEc19UcmFuc2FjdGlvblR5cGUiOiIwIiwiRHNfTWVyY2hhbnREYXRhIjoiIiwiRHNfQXV0aG9yaXNhdGlvbkNvZGUiOiIrKysrKysiLCJEc19Db25zdW1lckxhbmd1YWdlIjoiMSJ9";
  // const signature = "vrUsaNbxfonyn4ONUos6oosUaTBY0_SGoKDel6qsHqk";
  // var str = getResponseCodeMessage("0180");
  // console.log(str, "respesta p[ositiva");
  const result = redsys.checkResponseParameters(merchantParams, signature);
  return result;
}

// GET SIGNATURE
router.get(
  "/signature",
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

// PROCESS RETURN
router.post(
  "/",
  [
    body("Ds_SignatureVersion"),
    body("Ds_MerchantParameters"),
    body("Ds_Signature"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    console.log("hola llego aqui");
    const data = matchedData(req, { includeOptionals: true });

    const { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature } = data;

    console.log(Ds_SignatureVersion, "signature version");
    console.log(Ds_MerchantParameters, "parameters");
    console.log(Ds_Signature, "signature");

    const infoDecoded = await decodeResponse(
      Ds_MerchantParameters,
      Ds_Signature
    );

    console.log(infoDecoded, "me viene la info");

    return "bien";
  }
);

module.exports = router;
