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

// GET ONE RANDOM TEST
router.get(
  "/get-random-test",
  [param("studentID").isInt().toInt()],
  async (req, res) => {
    try {
      const { studentID } = matchedData(req);
      // TENGO QUE CREAR VARIABLES PARA NUMERO DE PREGUNTAS, SI ES HARD....
      return knex("questions")
        .select({
          a: "questions.a",
          active: "questions.active",
          b: "questions.b",
          c: "questions.c",
          img: "questions.img",
          question: "questions.question",
        })
        .where("questions.permission", 1)
        .andWhere("questions.hard", 0)
        .andWhere("questions.active", 1)
        .orderByRaw("RAND()")
        .limit(30)
        .then((result) => {
          res.json({ result });
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

router.get(
  "/student-tests",
  [
    query("studentID").optional(),
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

    var {
      studentID = null,
      orderBy = null,
      orderDir = null,
      perPage = 10,
      page = 1,
    } = req.query;

    var getQuery = knex.table("student_tests");

    if (studentID) {
      getQuery.where("student_tests.idStudent", studentID);
    }

    var totalCount = await getQuery
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0);

    var results = await getQuery
      .limit(perPage)
      .offset((page - 1) * perPage)
      .distinct(
        "student_tests.idStudent",
        "student_tests.idTest as id",
        "student_tests.testResult"
      );

    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount[0].totalResults,
      results: results,
    });
  }
);

// GET ONE TEST RESULT
router.get("/:testID", [param("testID").isInt().toInt()], async (req, res) => {
  const { testID } = matchedData(req);
  return knex("tests")
    .leftJoin("questions", "tests.idQuestion", "questions.id")
    .select()
    .where("tests.idTest", testID)
    .then((result) => res.json({ result }));
});

// // CREAR PAYMENT
// router.post(
//   "/store-payment",
//   [
//     body("studentID"),
//     body("description"),
//     body("paymentType"),
//     body("quantity"),
//     body("type"),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(422).json({ errors: errors.array() });
//     }

//     const {
//       studentID = null,
//       description = null,
//       paymentType = null,
//       quantity = null,
//       type = "Cargo",
//     } = matchedData(req, { includeOptionals: true });

//     return knex("payments")
//       .insert({
//         idStudent: studentID,
//         description: description,
//         quantity: quantity,
//         type: type,
//         paymentType: paymentType,
//         date: new Date(),
//         active: 1,
//         created_at: new Date(),
//         updated_at: new Date(),
//       })
//       .then(([newID]) => {
//         return res.json({ newID });
//       })
//       .catch((err) => {
//         return res.status(500).send(err);
//       });
//   }
// );

// // DISABLE HOW
// router.post("/:ID", [param("ID").isInt().toInt()], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(422).json({ errors: errors.array() });
//   }

//   const data = matchedData(req, { includeOptionals: true });

//   knex("hows")
//     .update({
//       active: 0,
//       updated_at: new Date(),
//     })
//     .where("id", data.ID)
//     .then((result) => {
//       if (result > 0) {
//         return res.send(`Updated`);
//       }
//       return res.status(404).send("Not found");
//     })
//     .catch((err) => {
//       return res.status(500).send(err);
//     });
// });

module.exports = router;
