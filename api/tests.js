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

const PERMISSION_QUESTIONS = {
  A1: { total: 20, need: 18 },
  A2: { total: 20, need: 18 },
  AM: { total: 20, need: 18 },
  B: { total: 30, need: 27 },
};

// GET ONE RANDOM TEST
router.get(
  "/get-random-test",
  [query("type").optional(), query("permission").optional()],
  async (req, res) => {
    try {
      const { type, permission } = matchedData(req);

      const numberQuestions = PERMISSION_QUESTIONS[permission].total;

      const permissionID = await knex("permissions")
        .select("permissions.id")
        .where("permissions.name", permission)
        .first()
        .then((res) => {
          return res.id;
        });

      const query = knex("questions")
        .select({
          id: "questions.id",
          a: "questions.a",
          active: "questions.active",
          b: "questions.b",
          c: "questions.c",
          img: "questions.img",
          question: "questions.question",
          correctAnswer: "questions.correctAnswer",
          permission: "questions.permission",
          hard: "questions.hard",
        })
        .where("questions.permission", permissionID);

      if ("reto" === type) {
        query.where("questions.hard", 1);
      }

      if ("error" === type) {
        query.orderBy("questions.fails", "desc");
      } else {
        query.orderByRaw("RAND()");
      }

      query
        .andWhere("questions.active", 1)
        .limit(numberQuestions)
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

    var passedTests =
      (await knex("student_tests")
        .where("idStudent", studentID)
        .where("testResult", 1)
        .count("*", { as: "passedTests" })
        .limit(999999)
        .offset(0)
        .first()
        .then((res) => {
          return res.passedTests;
        })) || 0;

    var results = await getQuery
      .select(
        knex.raw(
          "ROW_NUMBER() OVER(ORDER BY student_tests.created_at) AS num_row"
        ),
        // "student_tests.idStudent",
        "student_tests.idTest as id",
        // "student_tests.date",
        // "student_tests.created_at",
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

    var totalCount = await knex("student_tests")
      .where("student_tests.idStudent", studentID)
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

    console.log(passedTests, "test aprobados");

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
  [body("student"), body("questions")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { student = null, questions = null } = matchedData(req, {
      includeOptionals: true,
    });

    const numberQuestions = PERMISSION_QUESTIONS[student.permission].total;
    const numberQuestionsNeed = PERMISSION_QUESTIONS[student.permission].need;

    const lastTestId = await knex("student_tests")
      .count("* as lastId")
      .then(([res]) => {
        return res.lastId;
      });

    const newIdTest = lastTestId + 1;

    // Comprobamos las respuestas correctas que ha tenido
    const correctAnswers = questions.filter(
      (question) => parseInt(question.chosenAnswer) === question.correctAnswer
    ).length;

    console.log(correctAnswers, "/", numberQuestions, "questions");

    let testResult;

    // Ahora hay que comprobar si el test esta aprobado
    if (correctAnswers >= numberQuestionsNeed) {
      testResult = 1;
    } else {
      testResult = 0;
    }

    console.log(testResult, "resultado");

    (await questions.length) &&
      questions.map(async (question, index) => {
        const answerResult =
          parseInt(question.chosenAnswer) === question.correctAnswer ? 1 : 0;

        await knex("tests").insert({
          idTest: newIdTest,
          idQuestion: question.id,
          answer: question.chosenAnswer,
          result: answerResult,
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (answerResult == 0) {
          const previusFails = await knex("questions")
            .where("questions.id", question.id)
            .then((res) => {
              return res[0].fails;
            });

          await knex("questions")
            .update({ fails: previusFails + 1, updated_at: new Date() })
            .where("questions.id", question.id);
        }
      });

    await knex("student_tests").insert({
      idStudent: student.id,
      idTest: newIdTest,
      date: new Date(),
      testResult: testResult,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.json({ hola: "Test guardad correctamente" });
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
