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
          id: "questions.id",
          a: "questions.a",
          active: "questions.active",
          b: "questions.b",
          c: "questions.c",
          img: "questions.img",
          question: "questions.question",
          correctAnswer: "questions.correctAnswer",
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

    var passedTests = await knex("student_tests")
      .where("idStudent", studentID)
      .where("testResult", 1)
      .count("*", { as: "passedTests" })
      .offset(0)
      .then((res) => {
        return res.passedTests;
      });

    var results = await getQuery
      .select(
        knex.raw("ROW_NUMBER() OVER(ORDER BY student_tests.created_at) AS num_row"),
        // "student_tests.idStudent",
        "student_tests.idTest as id",
        "student_tests.date",
        "student_tests.created_at",
        "student_tests.testResult"
      )
      .leftJoin("tests", "tests.idTest", "student_tests.idTest")
      .where("tests.result", 1)
      .count("tests.result as result")
      .groupBy([
        "student_tests.idTest",
        "tests.result",
        "student_tests.date",
        "student_tests.created_at",
        "student_tests.testResult",
      ])
      .orderBy("student_tests.created_at", "desc")
      .limit(perPage)
      .offset((page - 1) * perPage);

    var totalCount = await getQuery
      .clone()
      .count("*", { as: "totalResults" })
      .limit(999999)
      .offset(0)
      .first()
      .then((res) => {
        return res.totalResults;
      });

    const formatResults = results.map((elem) => {
      elem["num_row"] = elem["num_row"] * page;
      return elem;
    });

    return res.json({
      page: page || 1,
      perPage: perPage || 10,
      totalCount: totalCount,
      results: results,
      passed: passedTests,
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

// GUARDAR TEST
router.post(
  "/store-test",
  [body("studentID"), body("questions")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { studentID = null, questions = null } = matchedData(req, {
      includeOptionals: true,
    });

    // Comprobamos las respuestas correctas que ha tenido
    const correctAnswerTest = questions.filter(
      (question) => parseInt(question.answer) === question.correctAnswer
    ).length;
    // Comprobamos el numero de respuestas para saber el tipo de permiso
    const numberQuestions = questions.length;

    let testResult;

    // Ahora hay que comprobar cuantas se necesitan para aprobar segun el tipo de permiso
    if (
      (correctAnswerTest > 26 && numberQuestions === 30) || // Coche
      (correctAnswerTest > 17 && numberQuestions === 20) // Moto
    ) {
      testResult = 1;
    } else {
      testResult = 0;
    }

    // Habra que calcular el ultimo id de test del alumno para hacer la enumeracion

    // return knex("payments")
    //   .insert({
    //     idStudent: studentID,
    //     description: description,
    //     quantity: quantity,
    //     type: type,
    //     paymentType: paymentType,
    //     date: new Date(),
    //     active: 1,
    //     created_at: new Date(),
    //     updated_at: new Date(),
    //   })
    //   .then(([newID]) => {
    //     return res.json({ newID });
    //   })
    //   .catch((err) => {
    //     return res.status(500).send(err);
    //   });

    return res.json({ hola: "hola" });
  }
);

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
